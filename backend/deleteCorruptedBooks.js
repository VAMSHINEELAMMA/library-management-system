require("dotenv").config();
const mongoose = require("mongoose");
const Book = require("./models/Book");

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  const result = await Book.deleteMany({});
  console.log("Deleted " + result.deletedCount + " corrupted books");
  process.exit(0);
})
.catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
