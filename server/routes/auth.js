const passport = require("passport");
const PassportLocalStrategy = require("passport-local").Strategy;

module.exports = function(ic) {
  const user = {
    username: ic.appUsername,
    password: ic.appPassword,
    displayName: ic.appDisplayName
  };

  function findUser(username, callback) {
    if (username === user.username) {
      return callback(null, user);
    }
    return callback(null);
  }

  passport.serializeUser(function(user, cb) {
    cb(null, user.username);
  });

  passport.deserializeUser(function(username, cb) {
    findUser(username, cb);
  });

  passport.use(
    new PassportLocalStrategy(function(username, password, done) {
      if (username === user.username && password === user.password) {
        return done(null, user);
      }

      return done(null, false, { message: "Incorrect username and/or password." });

      /*
      User.findOne({ username: username }, function(err, user) {
        if (err) { return done(err); }
        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }
        if (!user.validPassword(password)) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
      });
      */
    })
  );

  passport.isAuthRedirect = function() {
    return function(req, res, next) {
      if (req.isAuthenticated()) {
        return next();
      }
      res.redirect("/");
    };
  };
};
