function cacheRequest () {
    return function (req) {

      // res.complete;

      console.log('logged', req.path);

      return;

    };
}

module.exports = cacheRequest;
