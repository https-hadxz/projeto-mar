const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, age } = req.body;

    if (!username || !email || !password || !age) {
      return res.status(400).json({
        message: "Preencha todos os campos."
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Este e-mail já está cadastrado."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      age
    });

    res.status(201).json({
      message: "Usuário criado com sucesso!",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        age: user.age
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erro ao criar usuário."
    });
  }
});

module.exports = router;