const mongoose = require("mongoose");

const borrowSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },

    status: {
      type: String,
      enum: ["borrowed", "returned"],
      default: "borrowed"
    },

    borrowDate: { type: Date, default: Date.now },

    returnDate: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model("BorrowRecord", borrowSchema);
