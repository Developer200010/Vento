import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: function() {
        // Username required only for email/password signup
        return !this.googleId;
      },
      unique: true,
      sparse: true, // Allows null values to be non-unique
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function() {
        // Password required only for email/password signup
        return !this.googleId;
      },
    },
    // 🆕 Google OAuth fields
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows null values to be non-unique
    },
    profilePicture: {
      type: String,
      default: null,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate model compilation in Next.js hot reload
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;