const BorrowRecord = require("../models/BorrowRecord");
const Book = require("../models/Book");

exports.borrowBook = async (req, res) => {
  const { bookId } = req.body;

  const book = await Book.findById(bookId);
  if (!book) return res.status(404).json({ message: "Book not found" });

  if (book.availableCopies <= 0)
    return res.status(400).json({ message: "Book unavailable" });

  book.availableCopies -= 1;
  await book.save();

  const borrow = await BorrowRecord.create({
    user: req.user._id,
    book: bookId,
  });

  res.status(201).json(borrow);
};

exports.returnBook = async (req, res) => {
  const { id } = req.params;

  const record = await BorrowRecord.findById(id);
  if (!record) return res.status(404).json({ message: "Borrow record not found" });

  if (record.status === "returned")
    return res.status(400).json({ message: "Already returned" });

  record.status = "returned";
  record.returnDate = Date.now();
  await record.save();

  const book = await Book.findById(record.book);
  book.availableCopies += 1;
  await book.save();

  res.json({ message: "Book returned" });
};

exports.myBorrows = async (req, res) => {
  const records = await BorrowRecord.find({ user: req.user._id }).populate("book");
  res.json(records);
};
