const express = require("express");
const router = express.Router();
const { makeDummyPayment } = require("../controllers/paymentController");

router.post("/pay", makeDummyPayment);
router.post("/pay", async (req, res) => {
    const { amount, bookId, userId } = req.body;

    if (!amount || !bookId || !userId) {
        return res.status(400).json({ message: "Missing fields" });
    }

    const fakeTxn = "txn_" + Math.random().toString(36).substring(2, 12);

    res.json({
        success: true,
        message: "Payment successful",
        transactionId: fakeTxn
    });
});

module.exports = router;
