const express = require("express");
const router = express.Router();
const {
  borrowBook,
  returnBook,
  myBorrows,
} = require("../controllers/borrowController");

const auth = require("../middlewares/authMiddleware");

// User must be logged in
router.post("/", auth, borrowBook);
router.post("/:id/return", auth, returnBook);
router.get("/me", auth, myBorrows);

module.exports = router;
