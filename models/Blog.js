const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    author: {
      type: String,
      required: true,
      trim: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    author: {
      type: String,
      required: true,
      trim: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },

    // 🔁 REPLIES
    replies: [replySchema],

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    author: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ❤️ LIKES
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // 💬 COMMENTS
    comments: [commentSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Blog", blogSchema);