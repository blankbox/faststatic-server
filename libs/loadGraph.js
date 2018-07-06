const _ = require("underscore");

function loadGraph(db) {
  return function(req, res, next) {
    console.log('req', req.path);
    const q = `select expand($d) \
      let $site = (traverse out('DomainSite') from (select * from \`Domain\` where domainname = '${req.hostname}')),\
          $sitepath = (select * from (traverse out() from $site) where path = '${req.path}'),\
          $page = (traverse out('PageLink'), out('PageEntities'), out('MenuLink'), out('PageComponent') from $sitepath),\
          $items = (select * from (traverse * from (select * from $page where @class='Menu')) where @class='MenuMenuItem' OR @class='MenuItem'),\
          $components = (select * from (traverse * from (select * from $page where @class='Component'))),\
          $d = unionall($site, $sitepath, $page, $items, $components)`;

    // return res.send(q);

    db
      .query(q)
      .then(result => {
        if (result.length < 1) {
          return res.send("Site not found");
        }

        // console.log('results', result);

        const output = {};

        result.forEach(row => {
          if (row["@class"] === "Domain") {
            if (typeof output.domain === "undefined") {
              output.domain = {};
            }
            output.domain.name = row.name;
            output.domain.cdn = row.cdn;
          }

          if (row["@class"] === "Site") {
            if (typeof output.site === "undefined") {
              output.site = {};
            }
            output.site.name = row.name;
            output.site.status = row.status;
          }

          if (row["@class"] === "Path") {
            if (typeof output.path === "undefined") {
              output.path = {};
            }
            output.path.path = row.path;
          }

          if (row["@class"] === "Page") {
            if (typeof output.page === "undefined") {
              output.page = {};
            }
            output.page.name = row.name;
            output.page.title = row.title;
            output.page.body = row.body;
          }

          if (row["@class"] === "Template") {
            if (typeof output.template === "undefined") {
              output.template = {};
            }
            output.template.name = row.name;
            output.template.title = row.title;
            output.template.body = row.body;
            output.template.selector = row.selector;
            output.template.attach = row.attach;
          }

          if (row["@class"] === "Component") {
            if (typeof output.component === "undefined") {
              output.component = {};
            }
            output.component.name = row.name;
            output.component.data = row.data;
          }

          if (row["@class"] === "MenuMenuItem") {
            if (typeof output.menus === 'undefined') {
              output.menus = {};
            }
            // console.log('row', row.in.name, row.out.name);
            if (typeof output.menus[row.out.name] === "undefined") {
              output.menus[row.out.name] = [];
            }
            const item = { name: row.in.name, weight: row.weight, path: row.in.link, body: row.in.body };
            const arr = output.menus[row.out.name];
            arr.splice(_.sortedIndex(arr, item, "weight"), 0, item);
          }

          if (row["@class"] === "Menu") {
            if (typeof output.literals === 'undefined') {
              output.literals = {};
            }
            // console.log('row', row.in.name, row.out.name);
            if (typeof output.literals[row.name] === "undefined") {
              output.literals[row.name] = row.literal;
            }
          }

        });

        req.output = output;
        return next();

      })
      .catch(err => {
        console.log("err", err);
        return next(err);
      });
  };
}

module.exports = loadGraph;
