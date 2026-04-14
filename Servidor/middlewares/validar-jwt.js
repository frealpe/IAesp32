const { response, request } = require("express");
const jwt = require("jsonwebtoken");
const Usuario = require("../models/usuario");

const validarJWT = async (req = request, res = response, next) => {
  let token;

  const { authorization } = req.headers;

  if (authorization) {
    token = authorization.split(" ")[1] || "";
  }

  token = token || req.header("x-token");

  if (!token) {
    return res.status(403).json({
      msg: "No hay token en la solicitud",
      message: "Unauthorized",
    });
  }

  try {
    const { uid } = jwt.verify(token, process.env.SECRETORPRIVATEKEY);

    req.uid = uid;

    const usuario = await Usuario.findById(uid);

    if (!usuario) {
      return res.status(401).json({
        msg: "Token no valido - usuario no existe",
        message: "Unauthorized",
      });
    }

    if (!usuario.estado) {
      return res.status(401).json({
        msg: "Token no valido - usuario estado: false",
        message: "Unauthorized",
      });
    }

    req.usuario = usuario;
    req.usuarioAutenticado = usuario;
    req.token = token;

    next();
  } catch (error) {
    res.status(403).json({
      msg: "Token no válido",
      message: "Unauthorized",
    });
  }
};

module.exports = {
    validarJWT
}
