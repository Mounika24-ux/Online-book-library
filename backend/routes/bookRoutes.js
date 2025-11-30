const express = require("express");
const router = express.Router();
const { getBooks, addBook } = require("../controllers/bookController");

const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

// Public
router.get("/", getBooks);

// Admin only
router.post("/", auth, role("admin"), addBook);

module.exports = router;
