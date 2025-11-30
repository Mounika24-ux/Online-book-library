const Book = require("../models/Book");

exports.getBooks = async (req, res) => {
  const books = await Book.find();
  res.json(books);
};

exports.addBook = async (req, res) => {
  const { title, author, category, description, totalCopies } = req.body;

  const book = await Book.create({
    title,
    author,
    category,
    description,
    totalCopies,
    availableCopies: totalCopies,
  });

  res.status(201).json(book);
};
