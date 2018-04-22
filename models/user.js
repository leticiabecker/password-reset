//reference mongoose
const mongoose = require('mongoose');
const passport = require('passport');
const plm = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate');

// user schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  password: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

// automatically define username and password fields for this model
userSchema.plugin(plm);
userSchema.plugin(findOrCreate);

// make it public
module.exports = mongoose.model('User', userSchema);