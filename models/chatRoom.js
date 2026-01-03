import mongoose from "mongoose";

const chatroomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Chatroom name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    
    location: {
      latitude: {
        type: Number,
        required: [true, "Latitude is required"],
        min: [-90, "Latitude must be between -90 and 90"],
        max: [90, "Latitude must be between -90 and 90"],
      },
      longitude: {
        type: Number,
        required: [true, "Longitude is required"],
        min: [-180, "Longitude must be between -180 and 180"],
        max: [180, "Longitude must be between -180 and 180"],
      },
    },
    
    radius: {
      type: Number,
      required: [true, "Radius is required"],
      min: [0.1, "Radius must be at least 0.1 km"],
      max: [100, "Radius cannot exceed 100 km"],
    },
    
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Auto-creates createdAt and updatedAt
  }
);

// Create index for faster location queries
chatroomSchema.index({ 
  "location.latitude": 1, 
  "location.longitude": 1 
});

const Chatroom = mongoose.models.Chatroom || 
                 mongoose.model("Chatroom", chatroomSchema);

export default Chatroom;