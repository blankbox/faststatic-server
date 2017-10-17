const cheerio = require('cheerio');

function generatePage (cms) {
    return function (req, res) {
      const settings = req.settings;
    
      // Find the path key - returns with pure html
      cms.hgetall(`path:${req.sitename}:${req.path}`, function (err, response) {
    
        if (err) {
          console.log('Err happened');
        }
    
        // Check if key found
        if (response) {
          
          if (response.restrict) {
            // As the page is restricted, check to see if their permit allows them
            
            if (typeof req.permit[req.sitename] !== 'undefined') {
              
              let reg = new RegExp(req.permit[req.sitename]);
    
              if (!reg.test(req.path)) {
                res.cookie('originalRequest', req.path);
                return res.redirect(response.restrict);
              }
                
            } else {
                res.cookie('originalRequest', req.path);
                return res.redirect(response.restrict);
            }
            
          }
          
          // Fetch the template settings for the current layout
          cms.hgetall(`template:${req.sitename}:${response.template}`, function (err, template) {
    
            if (err) {
              console.log('Err happened');
            }
    
            // Check if a template is found
            if (template) {
    
              // Load the templated into Cheerio / backend jQuery
              let $ = cheerio.load(template.body);
              // Pass the layout into the template
              $(template.selector)[template.attach](response.layout);
    
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
    
              if (typeof req.permit[req.sitename] !== 'undefined') {
                resbody.attr('data-permit', 'true');
              }
    
              if (settings.cdn) {
                $('[href][data-cdn]').attr('href', function() { return settings.cdn + $(this).attr('href') });
                $('[src][data-cdn]').attr('src', function() { return settings.cdn + $(this).attr('src') });
              }
    
              // Key found, so just spit it out in response to the request
              return res.send($.html());
    
            } else {
    
              // no template found - get site's 404 template
              if (typeof settings['404'] !== 'undefined') {
        
                      // no template found
                  cms.hgetall(`template:${req.sitename}:${settings['404']}`, function (err, template) {
                    
                    if (err) {
                      return res.send('unknown template error');
                    }
            
                    let $ = cheerio.load(template.body);
            
                    $(template.selector)[template.attach]($('<h1>').text(`404 - template doesn't exist`));
            
                    return res.send($.html());
            
                  });
        
              } else {
    
                // Site has no 404 template
                return res.send('404');
    
              }
    
            }
    
          });
    
        } else {
          // no response
          
          // Site has template, but doesn't have page - standard 404
          if (typeof settings['404'] !== 'undefined') {
    
              // no template found
              cms.hgetall(`template:${req.sitename}:${settings['404']}`, function (err, template) {
                
                if (err) {
                  return res.sned('unknown template error');
                }
        
                let $ = cheerio.load(template.body);
    
                $(template.selector)[template.attach]($('<h1>').text(`404 - page doesn't exist`));
    
                return res.send($.html());
        
              });
    
          } else {
    
            // Site has no 404 template
            return res.send('404');
    
          }
        }
    
      });
    
    };
}

module.exports = generatePage;