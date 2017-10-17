function logoutProcessor (req, res, next) {

  res.cookie("jwt", "", { expires: new Date(0)});
  return res.redirect('/');

}

module.exports = logoutProcessor;