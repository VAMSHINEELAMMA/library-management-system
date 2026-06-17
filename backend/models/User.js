const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  role: {
    type: String,
    enum: ["member", "librarian", "admin"],
    default: "member"
  },
  membershipDate: { type: Date, default: Date.now },
  fineBalance: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  lastLogout: { type: Date },
  loginHistory: [
    {
      loginTime: { type: Date },
      logoutTime: { type: Date }
    }
  ]
}, { timestamps: true });

UserSchema.pre("save", function(next) {
  var user = this;
  if (!user.isModified("password")) return next();
  bcrypt.genSalt(10, function(err, salt) {
    if (err) return next(err);
    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

UserSchema.methods.comparePassword = function(candidatePassword) {
  return new Promise(function(resolve, reject) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
      if (err) return reject(err);
      resolve(isMatch);
    });
  }.bind(this));
};

module.exports = mongoose.model("User", UserSchema);
