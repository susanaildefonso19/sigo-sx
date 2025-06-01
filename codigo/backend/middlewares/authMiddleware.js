// Permite verificar o token de autenticação JWT e restringir o acesso a utilizadores com perfil "admin"
const jwt = require('jsonwebtoken'); // Importa a biblioteca JWT, usada para decodificar e verificar tokens de autenticação
const User = require('../models/userModel'); // Importa o modelo de utilizador, que contém a definição do esquema e métodos para interagir com a coleção de utilizadores no MongoDB

async function authMiddleware(req, res, next) { //Define uma função middleware assíncrona, que será chamada antes de executar a rota protegida
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1]; // Extrai o token JWT do cabeçalho Authorization
  if (!token) return res.status(401).json({ msg: 'Token não fornecido.' }); //Se não houver token, responde com erro 401 (não autorizado).

  try {
    const decoded = jwt.verify(token, 'segredo_sigo'); // Tenta verificar o token usando a chave secreta (segredo_sigo). Se for válido, decoded conterá o id do utilizador e possivelmente outras informações
    req.user = await User.findById(decoded.id); //  Com base no id contido no token, vai buscar os dados completos do utilizador na base de dados e associa à requisição (req.user). Isso permite que outras funções saibam quem é o utilizador autenticado
    if (req.user.tipo !== 'admin') {
      return res.status(403).json({ msg: 'Acesso negado.' }); // Se o utilizador não for do tipo "admin", responde com erro 403 (proibido)
    }
    next(); // Se tudo estiver certo (token válido e tipo admin), continua para a próxima função da rota
  } catch (err) {
    res.status(401).json({ msg: 'Token inválido.' }); // Se a verificação do token falhar (expirado, malformado, ou chave errada), responde com erro 401 (não autorizado)
  }
}

module.exports = authMiddleware; // Exporta o middleware para que possa ser usado noutras partes da aplicação