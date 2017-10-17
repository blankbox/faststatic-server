// Modules that are always loaded
// Place conditionally loaded module in conditional code
const express = require('express');
const helmet = require('helmet');
const redis = require("redis");

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

// create a redis connections
const redisConfig = {
  cms: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    db: process.env.REDIS_DB,
    retry_strategy: retry_strategy
  },
  users: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    db: process.env.REDIS_USER_DB,
    retry_strategy: retry_strategy
  }
};

// Set up all required redis connections
let cms = redis.createClient(redisConfig.cms);
let users = redis.createClient(redisConfig.users);

// show error in console
cms.on("error", function (err) {
    console.log("CMS Error " + err);
});

// show error in console
users.on("error", function (err) {
    console.log("User Error " + err);
});

// Begin the intial app
let app = express();

// Ensure that body and cookies can be used
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(cookieParser());

// Do security stuff
app.use(helmet());

// To support local development, provide a local CDN
if (typeof process.env.CDN !== 'undefined') {
  const serveIndex = require('serve-index');
  app.use('/public', express.static(`${process.cwd()}${process.env.CDN}`), serveIndex(`${process.cwd()}/cdn`, {'icons': true}));
}

// Attach all the application middleware
const permitCheck = require('./libs/permitCheck');
const siteEnabledCheck = require('./libs/siteEnabledCheck')(cms);
const formPostProcessor = require('./libs/formPostProcessor');
const loginformProcessor = require('./libs/loginformProcessor')(users);
const logoutProcessor = require('./libs/logoutProcessor');
const generatePage = require('./libs/generatePage')(cms);

app.use(permitCheck);
app.use(siteEnabledCheck);
app.post('/form', formPostProcessor);
app.post('/login', loginformProcessor);
app.all('/logout', logoutProcessor);
app.use(generatePage);

module.exports = app;