const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/user");
const Article = require("../models/article");
const Animal = require("../models/animal");
const auth = require("../middleware/auth");

const router = express.Router();

const MAX_AVATAR_BYTES = 400 * 1024;
const MAX_BANNER_BYTES = 1.2 * 1024 * 1024;

const notFound = (res) =>
  res.status(404).json({ message: "Usuário não encontrado." });

function versao(user) {
  return user.profileUpdatedAt ? new Date(user.profileUpdatedAt).getTime() : 0;
}

function parseImagem(dataUrl, maxBytes) {
  const texto = String(dataUrl);
  const m = /^data:(image\/(?:jpeg|png|webp));base64,/.exec(texto);

  if (!m) {
    return { error: "Imagem inválida. Use JPG, PNG ou WEBP." };
  }

  const data = Buffer.from(texto.slice(m[0].length), "base64");

  if (!data.length) {
    return { error: "Imagem inválida." };
  }
  if (data.length > maxBytes) {
    return { error: "A imagem é muito grande. Use uma menor." };
  }

  return { data, contentType: m[1] };
}

function meuUsuario(user) {
  return {
    id: String(user._id),
    username: user.username,
    email: user.email,
    age: user.age,
    role: user.role,
    bio: user.bio || "",
    hasAvatar: !!user.hasAvatar,
    hasBanner: !!user.hasBanner,
    version: versao(user),
    createdAt: user.createdAt
  };
}

// Atualizar o próprio perfil (bio, foto de perfil e banner)
router.put("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return notFound(res);

    const corpo = req.body || {};

    if (corpo.bio !== undefined) {
      const bio = String(corpo.bio).trim();
      if (bio.length > 200) {
        return res
          .status(400)
          .json({ message: "A bio pode ter no máximo 200 caracteres." });
      }
      user.bio = bio;
    }

    if (corpo.avatar) {
      const img = parseImagem(corpo.avatar, MAX_AVATAR_BYTES);
      if (img.error) return res.status(400).json({ message: img.error });

      user.avatarData = img.data;
      user.avatarType = img.contentType;
      user.hasAvatar = true;
    } else if (corpo.removeAvatar === true) {
      user.avatarData = undefined;
      user.avatarType = undefined;
      user.hasAvatar = false;
    }

    if (corpo.banner) {
      const img = parseImagem(corpo.banner, MAX_BANNER_BYTES);
      if (img.error) return res.status(400).json({ message: img.error });

      user.bannerData = img.data;
      user.bannerType = img.contentType;
      user.hasBanner = true;
    } else if (corpo.removeBanner === true) {
      user.bannerData = undefined;
      user.bannerType = undefined;
      user.hasBanner = false;
    }

    user.profileUpdatedAt = new Date();
    await user.save();

    res.json({ message: "Perfil atualizado!", user: meuUsuario(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao atualizar perfil." });
  }
});

// Perfil público
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

    const user = await User.findById(req.params.id)
      .select("username bio hasAvatar hasBanner profileUpdatedAt createdAt role banned")
      .lean();

    if (!user) return notFound(res);

    const suspenso = !!user.banned;

    const [artigos, animais] = await Promise.all([
      Article.countDocuments({ author: user._id }),
      Animal.countDocuments({ owner: user._id })
    ]);

    res.json({
      id: String(user._id),
      username: user.username,
      bio: suspenso ? "" : user.bio || "",
      hasAvatar: !suspenso && !!user.hasAvatar,
      hasBanner: !suspenso && !!user.hasBanner,
      version: versao(user),
      isAdmin: user.role === "admin",
      suspended: suspenso,
      createdAt: user.createdAt,
      articlesCount: artigos,
      animalsCount: animais
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao buscar perfil." });
  }
});

// Imagens (foto de perfil e banner)
function rotaImagem(campo) {
  const Campo = campo.charAt(0).toUpperCase() + campo.slice(1);

  return async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

      const user = await User.findById(req.params.id).select(
        `+${campo}Data +${campo}Type has${Campo} banned`
      );

      if (
        !user ||
        user.banned ||
        !user[`has${Campo}`] ||
        !user[`${campo}Data`]
      ) {
        return res.status(404).json({ message: "Imagem não encontrada." });
      }

      res.set("Content-Type", user[`${campo}Type`] || "image/jpeg");
      res.set("Cache-Control", "public, max-age=86400");
      res.set("X-Content-Type-Options", "nosniff");
      res.send(Buffer.from(user[`${campo}Data`]));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao buscar imagem." });
    }
  };
}

router.get("/:id/avatar", rotaImagem("avatar"));
router.get("/:id/banner", rotaImagem("banner"));

module.exports = router;