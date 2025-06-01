// Controllers para gestão de ocorrências
const mongoose = require('mongoose');

// Definição do esquema para a coleção de ocorrências
const ocorrenciaSchema = new mongoose.Schema({
  tipo: String,
  datahora: Date,
  ano: Number,
  email: String,
  lat: Number,
  lng: Number,
  localizacao: String
});


const Ocorrencia = mongoose.model('Ocorrencia', ocorrenciaSchema); // Modelo de Ocorrência

module.exports = Ocorrencia; // Exporta o modelo para uso em outros módulos