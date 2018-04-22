var express = require('express');
var router = express.Router();

// references we need
const passport = require('passport');

// User model reference
const User = require('../models/user');

var async = require('async');
var nodemailer = require('nodemailer');
var crypto = require("crypto");




/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'Express',
    user: req.user
  });
});

// GET: /register
router.get('/register', (req, res, next) => {
  res.render('register', {
    title: 'Register',
    user: req.user
  });
});

// POST: /register
router.post('/register', (req, res, next) => {
  User.register(new User({
    username: req.body.username
  }), req.body.password, (err, user) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/login');
    }
  });
});


// GET: /login
router.get('/login', (req, res, next) => {
  res.render('login', {
    title: 'Login',
    user: req.user
  });
});

// POST: /login
router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureMessage: 'Invalid Login'
}));

// GET: /logout
router.get('/logout', (req, res, next) => {

  // end the user's session
  req.logout();

  // redirect to login or home
  res.redirect('/login');
});

// GET: /forgot
router.get('/forgot', (req, res, next) => {
  res.render('forgot', {
    title: 'Forgot Password',
    user: req.user
  });
});




// POST: /forgot
router.post('/forgot', function (req, res, next) {
  async.waterfall([
    function (done) {
      crypto.randomBytes(20, function (err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function (token, done) {
      User.findOne({
        username: req.body.username
      }, function (err, user) {
        if (!user) {
          // req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function (err) {
          done(err, token, user);
        });
      });
    },
    function (token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'comp2106pw@gmail.com',
          pass: 'kcxvftjvbudxahvk'
        }
      });
      var mailOptions = {
        to: user.username,
        from: 'comp2106pw@gmail.com',
        subject: 'Password Reset',
        text: 'You have requested to reset your password.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function (err) {
        console.log('mail sent');
        // req.flash('success', 'An e-mail has been sent to ' + user.username + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function (err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

// GET: /reset 
router.get('/reset/:token', function (req, res) {
  User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: {
      $gt: Date.now()
    }
  }, function (err, user) {
    if (!user) {
      // req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {
      token: req.params.token,
      user: req.user
    });
  });
});

// POST: /reset 
router.post('/reset/:token', function (req, res) {
  async.waterfall([
    function (done) {
      User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {
          $gt: Date.now()
        }
      }, function (err, user) {
        if (!user) {
          // req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if (req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function (err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function (err) {
              req.logIn(user, function (err) {
                done(err, user);
              });
            });
          })
        } else {
          // req.flash("error", "Passwords do not match.");
          return res.redirect('back');
        }
      });
    },
    function (user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'comp2106pw@gmail.com',
          pass: 'kcxvftjvbudxahvk'
        }
      });
      var mailOptions = {
        to: user.username,
        from: 'comp2106pw@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.username + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function (err) {
        // req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function (err) {
    res.redirect('/');
  });
});

// USER PROFILE
router.get("/users/:id", function (req, res) {
  User.findById(req.params.id, function (err, foundUser) {
    if (err) {
      // req.flash("error", "Something went wrong.");
      res.redirect("/");
    }
    Campground.find().where('author.id').equals(foundUser._id).exec(function (err, campgrounds) {
      if (err) {
        // req.flash("error", "Something went wrong.");
        res.redirect("/");
      }
      res.render("users/show", {
        user: foundUser,
        campgrounds: campgrounds
      });
    })
  });
});





module.exports = router;