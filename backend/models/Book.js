const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },

    author: { type: String, required: true },

    category: { type: String, required: true },

    description: { type: String },

    totalCopies: { type: Number, required: true },

    availableCopies: { type: Number, required: true },
    coverUrl: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Book", bookSchema);