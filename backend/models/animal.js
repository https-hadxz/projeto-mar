const mongoose = require("mongoose");

const animalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    species: { type: String, required: true, trim: true, maxlength: 80 },
    breed: { type: String, required: true, trim: true, maxlength: 80 },
    age: { type: Number, min: 0, max: 500, default: null },

    // Informações científicas
    scientificName: { type: String, trim: true, maxlength: 120, default: "" },
    family: { type: String, trim: true, maxlength: 100, default: "" },

    // Características
    lifespan: { type: Number, min: 0, max: 500, default: null },
    averageSize: { type: String, trim: true, maxlength: 100, default: "" },
    averageWeight: { type: String, trim: true, maxlength: 100, default: "" },

    // Informações biológicas e ecológicas
    diet: { type: String, trim: true, maxlength: 1000, default: "" },
    habitat: { type: String, trim: true, maxlength: 1000, default: "" },
    distribution: { type: String, trim: true, maxlength: 1000, default: "" },
    reproduction: { type: String, trim: true, maxlength: 1000, default: "" },
    behavior: { type: String, trim: true, maxlength: 1000, default: "" },
    ecologicalRole: { type: String, trim: true, maxlength: 1000, default: "" },

    // Conservação
    conservationStatus: {
      type: String,
      trim: true,
      maxlength: 100,
      default: ""
    },
    threats: { type: String, trim: true, maxlength: 1000, default: "" },
    curiosities: { type: String, trim: true, maxlength: 1500, default: "" },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },

    locationName: { type: String, trim: true, maxlength: 120, default: "" },
    latitude: { type: Number, min: -90, max: 90, default: null },
    longitude: { type: Number, min: -180, max: 180, default: null },

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