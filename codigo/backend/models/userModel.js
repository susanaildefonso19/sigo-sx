// Controllers para gestão de utilizadores
const mongoose = require('mongoose');

// Definição do esquema para a coleção de utilizadores
const userSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  tipo: { type: String, enum: ['user', 'admin'], default: 'user' },
  ultimoAcesso: { type: Date }
});

const User = mongoose.model('User', userSchema); // Modelo de Utilizador

module.exports = User; // Exporta o modelo para uso noutros módulos
