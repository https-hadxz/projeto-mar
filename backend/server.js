const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const articleRoutes = require("./routes/articles");
const animalRoutes = require("./routes/animals");

const app = express();

if (!process.env.JWT_SECRET) {
  console.warn("ATENÇÃO: a variável JWT_SECRET não está definida.");
}

const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((url) => url.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin) ||
        origin === "http://localhost:5173"
      ) {
        return callback(null, true);
      }
      return callback(new Error("Origem não permitida pelo CORS."));
    }
  })
);

app.use(express.json({ limit: "3mb" }));

app.get("/", (req, res) => {
  res.json({
    message: "Backend do App Mar funcionando!"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/animals", animalRoutes);

app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") {
    return res
      .status(413)
      .json({ message: "Imagem muito grande. Use uma foto menor." });
  }
  console.error(err.message);
  res.status(err.status || 500).json({ message: "Erro na requisição." });
});

async function startServer() {
  try {
    console.log("Tentando conectar ao MongoDB...");

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB conectado!");

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