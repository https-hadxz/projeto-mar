const express = require("express");
const mongoose = require("mongoose");
const Report = require("../models/report");
const Article = require("../models/article");
const Animal = require("../models/animal");
const auth = require("../middleware/auth");

const router = express.Router();

const MOTIVOS = ["spam", "ofensivo", "falso", "inadequado", "outro"];

router.post("/", auth, async (req, res) => {
  try {
    const { targetType, targetId, reason, details } = req.body;

    if (
      !["article", "animal"].includes(targetType) ||
      !mongoose.isValidObjectId(targetId)
    ) {
      return res.status(400).json({ message: "Conteúdo inválido." });
    }

    if (!MOTIVOS.includes(reason)) {
      return res.status(400).json({ message: "Escolha um motivo." });
    }

    const detalhes = String(details || "").trim();
    if (detalhes.length > 500) {
      return res
        .status(400)
        .json({ message: "Os detalhes podem ter no máximo 500 caracteres." });
    }

    const Model = targetType === "article" ? Article : Animal;
    const campoDono = targetType === "article" ? "author" : "owner";

    const alvo = await Model.findById(targetId).select(campoDono);
    if (!alvo) {
      return res.status(404).json({ message: "Conteúdo não encontrado." });
    }

    if (String(alvo[campoDono]) === String(req.user.id)) {
      return res
        .status(400)
        .json({ message: "Você não pode denunciar o seu próprio conteúdo." });
    }

    try {
      await Report.create({
        targetType,
        targetId,
        reason,
        details: detalhes,
        reporter: req.user.id
      });
    } catch (error) {
      if (error.code === 11000) {
        return res
          .status(400)
          .json({ message: "Você já denunciou este conteúdo." });
      }
      throw error;
    }

    res.status(201).json({
      message: "Denúncia enviada. Obrigado por ajudar a manter o site seguro!"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao enviar denúncia." });
  }
});

module.exports = router;