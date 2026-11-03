const express = require("express");
const mongoose = require("mongoose");
const Article = require("../models/article");
const Animal = require("../models/animal");

const router = express.Router();

const CAMPOS_AUTOR = "username hasAvatar profileUpdatedAt banned";

function formatarAutor(u) {
  if (!u) return null;
  return {
    id: String(u._id),
    username: u.username,
    hasAvatar: !!u.hasAvatar && !u.banned,
    version: u.profileUpdatedAt ? new Date(u.profileUpdatedAt).getTime() : 0
  };
}

// Feed misto de artigos e animais, do mais novo pro mais antigo
router.get("/", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 30);
    const tipo = req.query.type;
    const autor = req.query.author;

    if (autor && !mongoose.isValidObjectId(autor)) {
      return res.json({ items: [], next: null });
    }

    const filtroData = {};
    if (req.query.before) {
      const data = new Date(req.query.before);
      if (!Number.isNaN(data.getTime())) {
        filtroData.createdAt = { $lt: data };
      }
    }

    const buscarArtigos = !tipo || tipo === "article";
    const buscarAnimais = !tipo || tipo === "animal";

    const [artigos, animais] = await Promise.all([
      buscarArtigos
        ? Article.find({ ...filtroData, ...(autor ? { author: autor } : {}) })
            .select("title content tags author createdAt updatedAt")
            .sort({ createdAt: -1 })
            .limit(limit + 1)
            .populate("author", CAMPOS_AUTOR)
            .lean()
        : [],
      buscarAnimais
        ? Animal.find({ ...filtroData, ...(autor ? { owner: autor } : {}) })
            .select(
              "name species breed age description locationName hasPhoto owner createdAt updatedAt"
            )
            .sort({ createdAt: -1 })
            .limit(limit + 1)
            .populate("owner", CAMPOS_AUTOR)
            .lean()
        : []
    ]);

    const todos = [
      ...artigos.map((a) => ({
        type: "article",
        id: String(a._id),
        title: a.title,
        excerpt: a.content.slice(0, 320),
        truncated: a.content.length > 320,
        tags: a.tags || [],
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        author: formatarAutor(a.author)
      })),
      ...animais.map((a) => ({
        type: "animal",
        id: String(a._id),
        name: a.name,
        species: a.species,
        breed: a.breed || "",
        age: a.age === undefined ? null : a.age,
        excerpt: a.description.slice(0, 220),
        truncated: a.description.length > 220,
        locationName: a.locationName || "",
        hasPhoto: !!a.hasPhoto,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        author: formatarAutor(a.owner)
      }))
    ];

    todos.sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt));

    const items = todos.slice(0, limit);
    const next =
      todos.length > limit
        ? new Date(items[items.length - 1].createdAt).toISOString()
        : null;

    res.json({ items, next });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao carregar o feed." });
  }
});

module.exports = router;