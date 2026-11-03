const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const auth = require("../middleware/auth");

const router = express.Router();

const MAX_TENTATIVAS = 5;
const BLOQUEIO_MINUTOS = 15;

function publicUser(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    age: user.age,
    role: user.role,
    createdAt: user.createdAt
  };
}

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, age } = req.body;

    if (!username || !email || !password || !age) {
      return res.status(400).json({ message: "Preencha todos os campos." });
    }

    if (String(password).length < 8) {
      return res
        .status(400)
        .json({ message: "A senha precisa ter pelo menos 8 caracteres." });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanUsername = String(username).trim();

    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return res.status(400).json({ message: "Este e-mail já está cadastrado." });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const user = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      age
    });

    res.status(201).json({
      message: "Usuário criado com sucesso!",
      user: publicUser(user)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Nome de usuário ou e-mail já está em uso." });
    }

    console.error(error);
    res.status(500).json({ message: "Erro ao criar usuário." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Informe e-mail e senha." });
    }

    const user = await User.findOne({
      email: String(email).trim().toLowerCase()
    });

    // Conta bloqueada por tentativas erradas?
    if (user && user.lockUntil) {
      if (user.lockUntil > new Date()) {
        const minutos = Math.ceil((user.lockUntil - Date.now()) / 60000);
        return res.status(429).json({
          message: `Muitas tentativas incorretas. Tente novamente em ${minutos} minuto(s).`
        });
      }

      // O bloqueio já acabou: zera o contador
      await User.updateOne(
        { _id: user._id },
        { $set: { lockUntil: null, failedLoginAttempts: 0 } }
      );
      user.lockUntil = null;
      user.failedLoginAttempts = 0;
    }

    const senhaCorreta =
      user && (await bcrypt.compare(String(password), user.password));

    if (!senhaCorreta) {
      if (user) {
        const atualizado = await User.findOneAndUpdate(
          { _id: user._id },
          { $inc: { failedLoginAttempts: 1 } },
          { returnDocument: "after" }
        );

        if (atualizado && atualizado.failedLoginAttempts >= MAX_TENTATIVAS) {
          await User.updateOne(
            { _id: user._id },
            {
              $set: {
                lockUntil: new Date(Date.now() + BLOQUEIO_MINUTOS * 60000),
                failedLoginAttempts: 0
              }
            }
          );
          return res.status(429).json({
            message: `Muitas tentativas incorretas. Login bloqueado por ${BLOQUEIO_MINUTOS} minutos.`
          });
        }
      }

      return res.status(401).json({ message: "E-mail ou senha incorretos." });
    }

    if (user.banned) {
      return res.status(403).json({
        code: "banned",
        message:
          "Sua conta foi suspensa." +
          (user.banReason ? ` Motivo: ${user.banReason}` : "")
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET não está definida no servidor.");
      return res.status(500).json({ message: "Erro de configuração do servidor." });
    }

    if (user.failedLoginAttempts > 0) {
      await User.updateOne(
        { _id: user._id },
        { $set: { failedLoginAttempts: 0 } }
      );
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ message: "Login realizado!", token, user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao fazer login." });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    res.json({ user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao buscar usuário." });
  }
});

module.exports = router;