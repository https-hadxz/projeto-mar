const express = require("express");
const mongoose = require("mongoose");
const Report = require("../models/report");
const Article = require("../models/article");
const Animal = require("../models/animal");
const User = require("../models/user");
const auth = require("../middleware/auth");
const requireAdmin = require("../middleware/admin");

const router = express.Router();

router.use(auth, requireAdmin);

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const notFound = (res, texto) => res.status(404).json({ message: texto });

// Lista de denúncias
router.get("/reports", async (req, res) => {
  try {
    const status = req.query.status || "open";
    const filtro = {};
    if (["open", "resolved", "dismissed"].includes(status)) {
      filtro.status = status;
    }

    const reports = await Report.find(filtro)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("reporter", "username")
      .lean();

    const idsArtigos = reports
      .filter((r) => r.targetType === "article")
      .map((r) => r.targetId);
    const idsAnimais = reports
      .filter((r) => r.targetType === "animal")
      .map((r) => r.targetId);

    const [artigos, animais] = await Promise.all([
      Article.find({ _id: { $in: idsArtigos } })
        .select("title author")
        .populate("author", "username")
        .lean(),
      Animal.find({ _id: { $in: idsAnimais } })
        .select("name owner")
        .populate("owner", "username")
        .lean()
    ]);

    const mapaArtigos = new Map(artigos.map((a) => [String(a._id), a]));
    const mapaAnimais = new Map(animais.map((a) => [String(a._id), a]));

    res.json(
      reports.map((r) => {
        let target = null;

        if (r.targetType === "article") {
          const a = mapaArtigos.get(String(r.targetId));
          if (a) {
            target = {
              title: a.title,
              owner: a.author
                ? { id: String(a.author._id), username: a.author.username }
                : null
            };
          }
        } else {
          const a = mapaAnimais.get(String(r.targetId));
          if (a) {
            target = {
              title: a.name,
              owner: a.owner
                ? { id: String(a.owner._id), username: a.owner.username }
                : null
            };
          }
        }

        return {
          id: String(r._id),
          targetType: r.targetType,
          targetId: String(r.targetId),
          reason: r.reason,
          details: r.details,
          status: r.status,
          createdAt: r.createdAt,
          reporter: r.reporter ? r.reporter.username : "desconhecido",
          target
        };
      })
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao listar denúncias." });
  }
});

// Ignorar denúncia
router.post("/reports/:id/dismiss", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return notFound(res, "Denúncia não encontrada.");
    }

    const report = await Report.findById(req.params.id);
    if (!report) return notFound(res, "Denúncia não encontrada.");

    report.status = "dismissed";
    report.resolvedBy = req.user.id;
    report.resolvedAt = new Date();
    report.resolution = "Denúncia ignorada";
    await report.save();

    res.json({ message: "Denúncia ignorada." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao ignorar denúncia." });
  }
});

// Remover um artigo ou animal (e encerrar as denúncias dele)
router.delete("/content/:type/:id", async (req, res) => {
  try {
    const { type, id } = req.params;
    const Model = type === "article" ? Article : type === "animal" ? Animal : null;

    if (!Model || !mongoose.isValidObjectId(id)) {
      return notFound(res, "Conteúdo não encontrado.");
    }

    const removido = await Model.findByIdAndDelete(id);
    if (!removido) return notFound(res, "Conteúdo não encontrado.");

    await Report.updateMany(
      { targetType: type, targetId: id, status: "open" },
      {
        $set: {
          status: "resolved",
          resolvedBy: req.user.id,
          resolvedAt: new Date(),
          resolution: "Conteúdo removido pela moderação"
        }
      }
    );

    res.json({ message: "Conteúdo removido pela moderação." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao remover conteúdo." });
  }
});

// Lista de usuários
router.get("/users", async (req, res) => {
  try {
    const filtro = {};
    const q = String(req.query.q || "").trim();

    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filtro.$or = [{ username: rx }, { email: rx }];
    }

    const usuarios = await User.find(filtro)
      .select("username email role banned banReason createdAt")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json(
      usuarios.map((u) => ({
        id: String(u._id),
        username: u.username,
        email: u.email,
        role: u.role,
        banned: !!u.banned,
        banReason: u.banReason || "",
        createdAt: u.createdAt
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao listar usuários." });
  }
});

// Suspender usuário
router.post("/users/:id/ban", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return notFound(res, "Usuário não encontrado.");
    }
    if (id === req.user.id) {
      return res
        .status(400)
        .json({ message: "Você não pode suspender a si mesmo." });
    }

    const user = await User.findById(id).select("role");
    if (!user) return notFound(res, "Usuário não encontrado.");

    if (user.role === "admin") {
      return res
        .status(400)
        .json({ message: "Não é possível suspender outro administrador." });
    }

    const motivo = String((req.body || {}).reason || "").trim().slice(0, 200);

    await User.updateOne(
      { _id: id },
      { $set: { banned: true, banReason: motivo } }
    );

    res.json({ message: "Usuário suspenso." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao suspender usuário." });
  }
});

// Reativar usuário
router.post("/users/:id/unban", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return notFound(res, "Usuário não encontrado.");
    }

    const resultado = await User.updateOne(
      { _id: id },
      { $set: { banned: false, banReason: "" } }
    );

    if (!resultado.matchedCount) return notFound(res, "Usuário não encontrado.");

    res.json({ message: "Usuário reativado." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao reativar usuário." });
  }
});

module.exports = router;