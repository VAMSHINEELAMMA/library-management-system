const mongoose = require("mongoose");

const EBookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  category: { type: String, default: "" },
  description: { type: String, default: "" },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileSize: { type: String, default: "" },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  downloads: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("EBook", EBookSchema);
