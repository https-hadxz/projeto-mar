const express = require("express");
const mongoose = require("mongoose");
const Article = require("../models/article");
const auth = require("../middleware/auth");

const router = express.Router();

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function cleanTags(tags) {
  const list = Array.isArray(tags) ? tags : String(tags || "").split(",");
  const cleaned = list
    .map((tag) => String(tag).trim().toLowerCase())
    .filter(Boolean)
    .map((tag) => tag.slice(0, 30));
  return [...new Set(cleaned)].slice(0, 10);
}

function validate(body) {
  const title = String(body.title || "").trim();
  const content = String(body.content || "").trim();

  if (!title || !content) {
    return { error: "Preencha o título e o conteúdo." };
  }
  if (title.length > 150) {
    return { error: "O título pode ter no máximo 150 caracteres." };
  }
  if (content.length > 20000) {
    return { error: "O conteúdo pode ter no máximo 20.000 caracteres." };
  }

  return { title, content, tags: cleanTags(body.tags) };
}

const notFound = (res) =>
  res.status(404).json({ message: "Artigo não encontrado." });

// Listar / buscar
router.get("/", async (req, res) => {
  try {
    const { q, tag, author } = req.query;
    const filter = {};

    if (q && String(q).trim()) {
      const rx = new RegExp(escapeRegex(String(q).trim()), "i");
      filter.$or = [{ title: rx }, { content: rx }, { tags: rx }];
    }
    if (tag) {
      filter.tags = String(tag).trim().toLowerCase();
    }
    if (author && mongoose.isValidObjectId(author)) {
      filter.author = author;
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);

    const articles = await Article.find(filter)
      .select("title content tags author createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .limit(limit)
      .populate("author", "username")
      .lean();

    res.json(
      articles.map((a) => ({
        id: a._id,
        title: a.title,
        excerpt: a.content.slice(0, 200),
        tags: a.tags,
        author: a.author ? a.author.username : null,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao listar artigos." });
  }
});

// Ver um artigo
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

    const article = await Article.findById(req.params.id)
      .populate("author", "username")
      .populate("lastEditedBy", "username")
      .populate("revisions.editedBy", "username")
      .lean();

    if (!article) return notFound(res);

    res.json({
      id: article._id,
      title: article.title,
      content: article.content,
      tags: article.tags,
      author: article.author
        ? { id: article.author._id, username: article.author.username }
        : null,
      lastEditedBy: article.lastEditedBy ? article.lastEditedBy.username : null,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      revisions: (article.revisions || [])
        .map((r) => ({
          editedBy: r.editedBy ? r.editedBy.username : "desconhecido",
          summary: r.summary || "",
          editedAt: r.editedAt
        }))
        .reverse()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao buscar artigo." });
  }
});

// Criar
router.post("/", auth, async (req, res) => {
  try {
    const data = validate(req.body);
    if (data.error) return res.status(400).json({ message: data.error });

    const article = await Article.create({
      title: data.title,
      content: data.content,
      tags: data.tags,
      author: req.user.id,
      lastEditedBy: req.user.id
    });

    res.status(201).json({ id: article._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao criar artigo." });
  }
});

// Editar (qualquer usuário logado, como numa wiki)
router.put("/:id", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

    const data = validate(req.body);
    if (data.error) return res.status(400).json({ message: data.error });

    const article = await Article.findById(req.params.id);
    if (!article) return notFound(res);

    article.revisions.push({
      title: article.title,
      content: article.content,
      editedBy: req.user.id,
      summary: String(req.body.summary || "").trim().slice(0, 200)
    });

    if (article.revisions.length > 30) {
      article.revisions.splice(0, article.revisions.length - 30);
    }

    article.title = data.title;
    article.content = data.content;
    article.tags = data.tags;
    article.lastEditedBy = req.user.id;

    await article.save();

    res.json({ id: article._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao editar artigo." });
  }
});

// Excluir (autor ou admin)
router.delete("/:id", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

    const article = await Article.findById(req.params.id);
    if (!article) return notFound(res);

    const isAuthor = String(article.author) === String(req.user.id);
    const isAdmin = req.user.role === "admin";

    if (!isAuthor && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Só o autor ou um admin pode excluir este artigo." });
    }

    await article.deleteOne();

    res.json({ message: "Artigo excluído." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao excluir artigo." });
  }
});

module.exports = router;