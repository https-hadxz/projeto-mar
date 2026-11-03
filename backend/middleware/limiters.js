const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Muitas tentativas de login. Aguarde alguns minutos e tente de novo."
  }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Muitos cadastros a partir desta rede. Tente de novo mais tarde."
  }
});

const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Você enviou muitas denúncias em pouco tempo. Tente de novo mais tarde."
  }
});

// Limita só quem cria, edita ou exclui (leitura não conta)
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS",
  message: {
    message: "Muitas alterações em pouco tempo. Aguarde alguns minutos."
  }
});

module.exports = { loginLimiter, registerLimiter, reportLimiter, writeLimiter };