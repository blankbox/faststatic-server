const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const tokenSecret = require('./jwt');

function loginformProcessor(users) {
    return function (req, res, next) {
    
    const originalRequest = req.cookies.originalRequest;
    
    users.hgetall(`user:${req.body.user}`, function (err, response) {
      
      if (err) {
        console.log('err', err);
      }
      
      console.log('response', response.hash.slice(1, -1));
    
    
      // I'm not sure why, but redis is storing hashes with double quote wrapping. Until I've figured that out, or found a nier wway slice is used
      bcrypt.compare(req.body.password, response.hash.slice(1, -1), function(err, check) {
    
        if (err) {
          console.log('err', err);
        }
    
    
        if (check) {
    
          let payload = {
            data: JSON.parse(response.permit)
          };
          
    
          const tokenExpire = 24 * 60 * 60 * 1000;
          const token = jwt.sign(payload, tokenSecret, { expiresIn: tokenExpire });
        
          res.cookie('jwt', token);
        
          console.log('originalRequest', originalRequest);
    
          // Check for ajax - no redirect needed    
          if (req.headers['x-requested-with'] == 'XMLHttpRequest') {
            return res.json({'success': true, 'originalRequest': originalRequest});
          } else {
            if (typeof originalRequest !== 'undefined') {
              return res.redirect(originalRequest);
            } else {
              return res.redirect('/');
            }
          }
    
          
        } else {
    
          // Check for ajax - no redirect needed    
          if (req.headers['x-requested-with'] == 'XMLHttpRequest') {
            return res.json({'success': false, 'originalRequest': originalRequest});
          } else {
              res.redirect(req.originalUrl);
          }
          
        }
    
    
      });
    
    
    });
    
    };

}

module.exports = loginformProcessor;