const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

async function startServer() {
  try {
    console.log("Tentando conectar ao MongoDB...");

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB conectado!");

    app.get("/", (req, res) => {
      res.json({
        message: "Backend do App Mar funcionando!"
      });
    });

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("ERRO AO CONECTAR AO MONGODB:");
    console.error(error);
  }
}

startServer();