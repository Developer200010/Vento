import mongoose from "mongoose";

// What a message looks like in the database
const messageSchema = new mongoose.Schema(
  {
    // Which chatroom is this message in?
    chatroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chatroom",
      required: true,
    },

    // Who sent this message?
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // For display (so we don't need to fetch user every time)
    username: {
      type: String,
      required: true,
    },

    // The actual message text
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000, // Max 1000 characters per message
    },

    // When this message will expire (2 hours from creation)
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Index for faster queries
messageSchema.index({ chatroomId: 1, createdAt: -1 }); // Get messages by room, newest first
// messageSchema.index({ expiresAt: 1 }); // For automatic deletion

// Auto-delete expired messages (MongoDB TTL index)
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);

export default Message;