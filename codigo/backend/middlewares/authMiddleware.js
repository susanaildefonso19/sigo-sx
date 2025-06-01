// Permite verificar o token de autenticação JWT e restringir o acesso a utilizadores com perfil "admin"
const jwt = require('jsonwebtoken'); // Importa a biblioteca JWT, usada para decodificar e verificar tokens de autenticação
const User = require('../models/userModel'); // Importa o modelo de utilizador, que contém a definição do esquema e métodos para interagir com a coleção de utilizadores no MongoDB

module.exports = async function (req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ msg: 'Token não fornecido.' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'Token inválido.' });

  try {
    const decoded = jwt.verify(token, 'segredo_sigo');
    // Busca o utilizador completo para garantir que temos o tipo
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ msg: 'Utilizador não encontrado.' });
    req.user = user; // Agora req.user.tipo estará disponível!
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token inválido.' });
  }
};