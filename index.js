// Modules that are always loaded
// Place conditionally loaded module in conditional code
const express = require('express');
const helmet = require('helmet');
const redis = require("redis");
const db = require('./db');

// Needed for POST and cookies to work in Express
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');


const retry_strategy = function (options) {
    if (options.error && options.error.code === 'ECONNREFUSED') {
        // End reconnecting on a specific error and flush all commands with
        // a individual error
        return new Error('The server refused the connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
        // End reconnecting after a specific timeout and flush all commands
        // with a individual error
        return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
        // End reconnecting with built in error
        return undefined;
    }
    // reconnect after
    return Math.min(options.attempt * 100, 3000);
};

function load (options) {
  // Set up all required redis connections
  if (typeof options.cms.retry_strategy === 'undefined') {
    options.cms.retry_strategy = retry_strategy;
  }
  let cms = redis.createClient(options.cms);
  if (typeof options.users.retry_strategy === 'undefined') {
    options.users.retry_strategy = retry_strategy;
  }

  // show error in console
  cms.on("error", function (err) {
      console.log("CMS Error " + err);
  });

  // Begin the intial app
  let app = express();

  // Ensure that body and cookies can be used
  app.use(bodyParser.json()); // support json encoded bodies
  app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
  app.use(cookieParser());

  // Do security stuff

  // Implement X-XSS-Protection
  app.use(helmet.xssFilter());

  // Implement X-Frame: Deny
  app.use(helmet.frameguard());

  // Implement Strict-Transport-Security
  app.use(helmet.hsts({
    maxAge: 7776000000,
    includeSubdomains: true
  }));

  // Hide X-Powered-By
  app.use(helmet.hidePoweredBy());

  // To support local development, provide a local CDN
  if (typeof process.env.CDN !== 'undefined') {
    const serveIndex = require('serve-index');
    console.log('cdn root', `${process.cwd()}${process.env.CDN}`);
    app.use('/public', express.static(`${process.cwd()}/${process.env.CDN}`), serveIndex(`${process.cwd()}/${process.env.CDN}`, {'icons': true}));
  }

  // Attach all the application middleware
  const loadGraph = require('./libs/loadGraph')(db);
  const permitCheck = require('./libs/permitCheck');
  // const siteEnabledCheck = require('./libs/siteEnabledCheck')(cms);
  const formPostProcessor = require('./libs/formPostProcessor');
  // const loginformProcessor = require('./libs/loginformProcessor')(cms);
  // const logoutProcessor = require('./libs/logoutProcessor');
  const generatePage = require('./libs/generatePage')(cms);
  const cacheRequest = require('./libs/cacheRequest')(cms);

  app.use(loadGraph);
  app.use(permitCheck);
  // app.use(siteEnabledCheck);
  app.post('/form', formPostProcessor);
  // app.post('/login', loginformProcessor);
  // app.all('/logout', logoutProcessor);
  app.use(generatePage);
  app.use(cacheRequest);

  return app;

}

module.exports = load;
