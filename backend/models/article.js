const mongoose = require("mongoose");

// Cada edição guarda a versão ANTERIOR do texto, quem editou e um resumo.
const revisionSchema = new mongoose.Schema(
  {
    title: String,
    content: String,
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    summary: { type: String, default: "" },
    editedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    content: { type: String, required: true, maxlength: 20000 },
    tags: [{ type: String, trim: true, lowercase: true }],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    revisions: [revisionSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Article", articleSchema);