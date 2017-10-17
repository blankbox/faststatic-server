const jwt = require('jsonwebtoken');
const tokenSecret = require('./jwt');

function permitCheck (req, res, next) {

  // check if there is a jwt cookie for auth
  const jwtset = req.cookies.jwt;
  // create permit obj here to prevent errors
  req.permit = {};

  if (typeof jwtset === 'undefined') {
    return next();
  } else {

    // As there is a jwt in the cookies - verify it
    jwt.verify(jwtset, tokenSecret, function(err, decoded) {
      if(err) {
        console.log('jwt error', err);
        return res.send(`There was a problem with your token - try making a new one: https://jwt.io/`);
      } else {
        // pass the entire payload forward
        req.jwtpayload = decoded;
        // Update the request wide permit
        if (typeof decoded.data.sites !== 'undefined') {
          req.permit = decoded.data.sites;
        } else {
          req.permit = {};
        }
        return next();
      }
    });
    
  }
  
}

module.exports = permitCheck;