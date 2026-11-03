const mongoose = require("mongoose");

const animalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    species: { type: String, required: true, trim: true, maxlength: 80 },
    breed: { type: String, trim: true, maxlength: 80, default: "" },
    age: { type: Number, min: 0, max: 500, default: null },
    description: { type: String, required: true, trim: true, maxlength: 2000 },

    locationName: { type: String, trim: true, maxlength: 120, default: "" },
    latitude: { type: Number, min: -90, max: 90, default: null },
    longitude: { type: Number, min: -180, max: 180, default: null },

    // A foto fica no próprio banco (select: false = não vem nas listagens)
    hasPhoto: { type: Boolean, default: false },
    photoData: { type: Buffer, select: false },
    photoType: { type: String, select: false },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Animal", animalSchema);