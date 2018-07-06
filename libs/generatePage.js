const cheerio = require('cheerio');

const format = (template, params) => {
  const tpl = template.replace(/\${(?!this\.)/g, "${this.");
  const tpl_func = new Function(`return \`${tpl}\``);
  return tpl_func.call(params);
}


function generatePage () {
    return function (req, res, next) {
      const template = req.output.template;
      const page = req.output.page;

      let $ = cheerio.load(template.body);
      // Pass the layout into the template
      $(template.selector)[template.attach](page.body);

      let pageName = req.path.toString().substring(1);
      // If homepage, need to add name to be recognised
      if(pageName == '') {
        pageName = 'home';
      }

      // Set data path attribute to decide which CSS file should be loaded
      // Set data root attribute to be used for current nav etc.
      // Checks for pages with extended paths and adjusts data-root accordingly
      let resbody = $('body');
      resbody.attr('data-path', pageName).attr('data-root', pageName.split('/')[0]);

      if (req.output.domain.cdn) {
        $('[href][data-cdn]').attr('href', function() { return req.output.domain.cdn + $(this).attr('href') });
        $('[src][data-cdn]').attr('src', function() { return req.output.domain.cdn + $(this).attr('src') });
      }

      Object.keys(req.output.menus).forEach((menu) => {
        if(typeof req.output.literals[menu] !== 'undefined') {
          const menuItems = req.output.menus[menu].map((item) => {
            return $(format(req.output.literals[menu], item));
          })
          $(`[data-menu="${menu}"]`).append(menuItems)
        }
      })

      res.complete = $.html();

      // Key found, so just spit it out in response to the request
      res.send(res.complete);

      return next();

    };
}

module.exports = generatePage;
