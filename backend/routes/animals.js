const express = require("express");
const mongoose = require("mongoose");
const Animal = require("../models/animal");
const auth = require("../middleware/auth");

const router = express.Router();

const MAX_PHOTO_BYTES = 1.5 * 1024 * 1024;

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const notFound = (res) =>
  res.status(404).json({ message: "Animal não encontrado." });

function parsePhoto(dataUrl) {
  const texto = String(dataUrl);
  const m = /^data:(image\/(?:jpeg|png|webp));base64,/.exec(texto);

  if (!m) {
    return { error: "Foto inválida. Use uma imagem JPG, PNG ou WEBP." };
  }

  const data = Buffer.from(texto.slice(m[0].length), "base64");

  if (!data.length) {
    return { error: "Foto inválida." };
  }
  if (data.length > MAX_PHOTO_BYTES) {
    return { error: "A foto é muito grande. Use uma imagem menor." };
  }

  return { data, contentType: m[1] };
}

const vazio = (v) => v === null || v === undefined || v === "";

function validate(body) {
  const name = String(body.name || "").trim();
  const species = String(body.species || "").trim();
  const breed = String(body.breed || "").trim();
  const description = String(body.description || "").trim();
  const locationName = String(body.locationName || "").trim();

  if (!name || !species || !breed || !description) {
  return {
    error: "Preencha nome, espécie, raça e descrição."
  };
}
  if (name.length > 80 || species.length > 80 || breed.length > 80) {
    return { error: "Nome, espécie e raça podem ter no máximo 80 caracteres." };
  }
  if (description.length > 2000) {
    return { error: "A descrição pode ter no máximo 2.000 caracteres." };
  }
  if (locationName.length > 120) {
    return { error: "O nome do local pode ter no máximo 120 caracteres." };
  }
  const scientificName = String(body.scientificName || "").trim();
const family = String(body.family || "").trim();

const averageSize = String(body.averageSize || "").trim();
const averageWeight = String(body.averageWeight || "").trim();

const diet = String(body.diet || "").trim();
const habitat = String(body.habitat || "").trim();
const distribution = String(body.distribution || "").trim();
const reproduction = String(body.reproduction || "").trim();
const behavior = String(body.behavior || "").trim();
const ecologicalRole = String(body.ecologicalRole || "").trim();

const conservationStatus = String(body.conservationStatus || "").trim();
const threats = String(body.threats || "").trim();
const curiosities = String(body.curiosities || "").trim();

  let age = null;
  if (!vazio(body.age)) {
    age = Number(body.age);
    if (!Number.isFinite(age) || age < 0 || age > 500) {
      return { error: "Idade inválida. Informe um número entre 0 e 500." };
    }
  }
let lifespan = null;

if (!vazio(body.lifespan)) {
  lifespan = Number(body.lifespan);

  if (!Number.isFinite(lifespan) || lifespan < 0 || lifespan > 500) {
    return { error: "Expectativa de vida inválida." };
  }
}

const limites = [
  [scientificName, 120],
  [family, 100],
  [averageSize, 100],
  [averageWeight, 100],
  [diet, 1000],
  [habitat, 1000],
  [distribution, 1000],
  [reproduction, 1000],
  [behavior, 1000],
  [ecologicalRole, 1000],
  [conservationStatus, 100],
  [threats, 1000],
  [curiosities, 1500]
];

if (limites.some(([valor, limite]) => valor.length > limite)) {
  return { error: "Um dos campos informados ultrapassou o limite de caracteres." };
}
  let latitude = null;
  let longitude = null;
  if (!vazio(body.latitude) || !vazio(body.longitude)) {
    latitude = Number(body.latitude);
    longitude = Number(body.longitude);

    if (
      vazio(body.latitude) ||
      vazio(body.longitude) ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return { error: "Localização inválida no mapa." };
    }
  }

return {
  name,
  species,
  breed,
  description,
  locationName,
  age,
  latitude,
  longitude,

  scientificName,
  family,
  lifespan,
  averageSize,
  averageWeight,

  diet,
  habitat,
  distribution,
  reproduction,
  behavior,
  ecologicalRole,

  conservationStatus,
  threats,
  curiosities
};
}

// Listar / buscar (qualquer pessoa, mesmo sem login)
router.get("/", async (req, res) => {
  try {
    const { q, owner } = req.query;
    const filter = {};

    if (q && String(q).trim()) {
      const rx = new RegExp(escapeRegex(String(q).trim()), "i");
      filter.$or = [
        { name: rx },
        { species: rx },
        { breed: rx },
        { locationName: rx }
      ];
    }
    if (owner && mongoose.isValidObjectId(owner)) {
      filter.owner = owner;
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 60, 100);

    const animals = await Animal.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("owner", "username")
      .lean();

    res.json(
      animals.map((a) => ({
        id: a._id,
        name: a.name,
        species: a.species,
        breed: a.breed,
        age: a.age,
        locationName: a.locationName,
        hasPhoto: a.hasPhoto,
        owner: a.owner ? a.owner.username : null,
        updatedAt: a.updatedAt,
        scientificName: a.scientificName,
        family: a.family,
        lifespan: a.lifespan,
        averageSize: a.averageSize,
        averageWeight: a.averageWeight,
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao listar animais." });
  }
});

// Foto do animal (devolve a imagem em si)
router.get("/:id/photo", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

    const animal = await Animal.findById(req.params.id).select(
      "+photoData +photoType hasPhoto"
    );

    if (!animal || !animal.hasPhoto || !animal.photoData) {
      return notFound(res);
    }

    res.set("Content-Type", animal.photoType || "image/jpeg");
    res.set("Cache-Control", "public, max-age=86400");
    res.set("X-Content-Type-Options", "nosniff");
    res.send(Buffer.from(animal.photoData));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao buscar foto." });
  }
});

// Detalhes de um animal (qualquer pessoa)
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

    const a = await Animal.findById(req.params.id)
      .populate("owner", "username")
      .lean();

    if (!a) return notFound(res);

    res.json({
      id: a._id,
      name: a.name,
      species: a.species,
      breed: a.breed,
      age: a.age,
      description: a.description,
      locationName: a.locationName,
      latitude: a.latitude,
      longitude: a.longitude,
      hasPhoto: a.hasPhoto,
      owner: a.owner ? { id: a.owner._id, username: a.owner.username } : null,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      scientificName: a.scientificName,
      family: a.family,
      lifespan: a.lifespan,
      averageSize: a.averageSize,
      averageWeight: a.averageWeight,
      diet: a.diet,
      habitat: a.habitat,
      distribution: a.distribution,
      reproduction: a.reproduction,
      behavior: a.behavior,
      ecologicalRole: a.ecologicalRole,
      conservationStatus: a.conservationStatus,
      threats: a.threats,
      curiosities: a.curiosities,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao buscar animal." });
  }
});

// Cadastrar (precisa estar logado; o dono é quem está logado)
router.post("/", auth, async (req, res) => {
  try {
    const data = validate(req.body);
    if (data.error) return res.status(400).json({ message: data.error });

    const possuiFotoNova = !!req.body.photo;
const removendoFoto = req.body.removePhoto === true;

if (!possuiFotoNova && (removendoFoto || !animal.hasPhoto)) {
  return res.status(400).json({
    message: "O animal precisa ter uma fotografia."
  });
}

    if (!req.body.photo) {
  return res.status(400).json({
    message: "A fotografia do animal é obrigatória."
  });
}

    const animal = new Animal({ ...data, owner: req.user.id });

    if (req.body.photo) {
      const foto = parsePhoto(req.body.photo);
      if (foto.error) return res.status(400).json({ message: foto.error });

      animal.photoData = foto.data;
      animal.photoType = foto.contentType;
      animal.hasPhoto = true;
    }

    await animal.save();

    res
      .status(201)
      .json({ id: animal._id, message: "Animal cadastrado com sucesso!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao cadastrar animal." });
  }
});

// Editar (só o dono)
router.put("/:id", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

    const animal = await Animal.findById(req.params.id);
    if (!animal) return notFound(res);

    if (String(animal.owner) !== String(req.user.id)) {
      return res
        .status(403)
        .json({ message: "Você só pode editar os animais que cadastrou." });
    }

    const data = validate(req.body);
    if (data.error) return res.status(400).json({ message: data.error });

    animal.set(data);

    if (req.body.photo) {
      const foto = parsePhoto(req.body.photo);
      if (foto.error) return res.status(400).json({ message: foto.error });

      animal.photoData = foto.data;
      animal.photoType = foto.contentType;
      animal.hasPhoto = true;
    } else if (req.body.removePhoto === true) {
      animal.photoData = undefined;
      animal.photoType = undefined;
      animal.hasPhoto = false;
    }

    await animal.save();

    res.json({ id: animal._id, message: "Animal atualizado com sucesso!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao editar animal." });
  }
});

// Excluir (só o dono)
router.delete("/:id", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

    const animal = await Animal.findById(req.params.id);
    if (!animal) return notFound(res);

    if (String(animal.owner) !== String(req.user.id)) {
      return res
        .status(403)
        .json({ message: "Você só pode excluir os animais que cadastrou." });
    }

    await animal.deleteOne();

    res.json({ message: "Animal excluído." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao excluir animal." });
  }
});

module.exports = router;