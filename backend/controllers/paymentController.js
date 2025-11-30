const Borrow = require("../models/Borrow");
const Book = require("../models/Book");

exports.makeDummyPayment = async (req, res) => {
  try {
    const { amount, bookId, userId } = req.body;

    if (!amount || !bookId || !userId) {
      return res.status(400).json({ message: "Missing payment info" });
    }

    // Create a fake transaction ID
    const fakeTransactionId = "txn_" + Math.random().toString(36).substring(2, 12);

    // Create a borrow record
    const borrow = new Borrow({
      bookId,
      userId,
      borrowDate: new Date(),
      paymentId: fakeTransactionId,
      amountPaid: amount,
    });

    await borrow.save();

    return res.json({
      success: true,
      message: "Payment successful",
      transactionId: fakeTransactionId,
    });
  } catch (error) {
    console.error("Payment Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
