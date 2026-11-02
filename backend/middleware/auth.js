const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "Faça login para continuar." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: payload.id,
      username: payload.username,
      role: payload.role
    };
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Sessão expirada. Faça login novamente." });
  }
}

module.exports = auth;