function siteEnabledCheck (cms) {
    return function (req, res, next) {
    
    // Get the set containing state
    cms.hgetall(`site:${req.hostname}`, function (err, response) {
    
    if (err) {
      console.log('Err happened');
    }
    
    // Check if there is anything return for the key
    if (response !== null) {
      
      // Set the name and skip to the next middleware
      req.sitename = response.name;
      req.settings = response;
    
      if (response.restrict && (response.restrict !== req.path)){
        if (typeof req.permit[response.name] === 'undefined') {
          res.cookie('originalRequest', req.path);
          return res.redirect(response.restrict);
        }
      }
    
      // If it's there, check if enabled
      if (response.enabled) {
        // Forward http to https for all traffic excluding sites that are specifically set to allow http
        // Is only affected by ELB or other load balancers - which should ALWAYS be the case in production
        // Dev environments will ignore and allow through http
        if(response.allowhttp !== true && req.headers['x-forwarded-proto'] === 'http'){
          return res.redirect('https://' + req.hostname + req.url);
        }
    
        next();
      } else {
        // Domain was found, but the site was not enabled
        return res.send('Site not enabled');
      }
    } else {
      // No key was found, so domain isn't valid
      return res.send('Site not found');
    }
    
    });
    
    };
}

module.exports = siteEnabledCheck;