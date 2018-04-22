var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
// added modules

var mongoose = require('mongoose');
var config = require('./config/globals');
var nodemailer = require('nodemailer');
// auth packages
var passport = require('passport');
var session = require('express-session');
var localStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');
var async = require('async');
var crypto = require('crypto');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// db connection
mongoose.connect(config.db);

// passport configuration
app.use(session({
  secret: 'any string for salting here',
  resave: true, //to refresh
  saveUninitialized: false // we don't need a session if the user is not logged in
}));

// session management for users
app.use(passport.initialize());
app.use(passport.session());

// reference User model
const User = require('./models/user');
passport.use(User.createStrategy());

// session management for users
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use('/', indexRouter);
app.use('/users', usersRouter);

// add in the user schema
// var userSchema = new mongoose.Schema({
//   username: { type: String, required: true, unique: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   resetPasswordToken: String,
//   resetPasswordExpires: Date
// });

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;