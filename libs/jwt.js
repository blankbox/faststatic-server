const fs = require('fs-extra');
let tokenSecret = 'secret';

if (typeof process.env.JWT_SECRET !== 'undefined') {
    
    if (fs.exitsSync(process.env.JWT_SECRET)) {
        tokenSecret = fs.readFileSync(process.env.JWT_SECRET, 'utf8');
    } else {
        tokenSecret = process.env.JWT_SECRET;
    }
    
}


module.exports = tokenSecret;