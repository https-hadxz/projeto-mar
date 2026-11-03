const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  age: {
    type: Number,
    required: true
  },

  role: {
    type: String,
    default: "user"
  },

  banned: {
    type: Boolean,
    default: false
  },

  banReason: {
    type: String,
    default: ""
  },

  failedLoginAttempts: {
    type: Number,
    default: 0
  },

  lockUntil: {
    type: Date,
    default: null
  },

  // Perfil
  bio: {
    type: String,
    trim: true,
    maxlength: 200,
    default: ""
  },

  hasAvatar: { type: Boolean, default: false },
  avatarData: { type: Buffer, select: false },
  avatarType: { type: String, select: false },

  hasBanner: { type: Boolean, default: false },
  bannerData: { type: Buffer, select: false },
  bannerType: { type: String, select: false },

  profileUpdatedAt: { type: Date, default: Date.now },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", userSchema);