const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    targetType: { type: String, enum: ["article", "animal"], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: {
      type: String,
      enum: ["spam", "ofensivo", "falso", "inadequado", "outro"],
      required: true
    },
    details: { type: String, trim: true, maxlength: 500, default: "" },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["open", "resolved", "dismissed"],
      default: "open"
    },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },
    resolution: { type: String, default: "" }
  },
  { timestamps: true }
);

// Cada pessoa só pode denunciar o mesmo conteúdo uma vez
reportSchema.index(
  { reporter: 1, targetType: 1, targetId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Report", reportSchema);