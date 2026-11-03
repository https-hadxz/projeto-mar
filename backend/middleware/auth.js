const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/user");

async function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "Faça login para continuar." });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Sessão expirada. Faça login novamente." });
  }

  try {
    if (!mongoose.isValidObjectId(payload.id)) {
      return res
        .status(401)
        .json({ message: "Sessão inválida. Faça login novamente." });
    }

    const user = await User.findById(payload.id).select(
      "username role banned banReason"
    );

    if (!user) {
      return res
        .status(401)
        .json({ message: "Conta não encontrada. Faça login novamente." });
    }

    if (user.banned) {
      return res.status(403).json({
        code: "banned",
        message:
          "Sua conta foi suspensa." +
          (user.banReason ? ` Motivo: ${user.banReason}` : "")
      });
    }

    req.user = {
      id: String(user._id),
      username: user.username,
      role: user.role
    };

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao verificar sua sessão." });
  }
}

module.exports = auth;