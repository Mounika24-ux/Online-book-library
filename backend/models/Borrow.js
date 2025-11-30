const mongoose = require("mongoose");

const BorrowSchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  borrowDate: {
    type: Date,
    default: Date.now,
  },
  paymentId: {
    type: String,
    required: true,
  },
  amountPaid: {
    type: Number,
    required: true,
  }
});

module.exports = mongoose.model("Borrow", BorrowSchema);
