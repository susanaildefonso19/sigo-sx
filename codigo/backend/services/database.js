require('dotenv').config(); // Importa o módulo dotenv para carregar variáveis de ambiente
const mongoose = require('mongoose'); // Importa o módulo mongoose para interagir com o MongoDB

const connectDB = async () => { 
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Ligado ao MongoDB com sucesso');
  } catch (err) {
    console.error('❌ Erro ao ligar ao MongoDB:', err.message);
    process.exit(1);
  }
}; // Função para conectar ao MongoDB

module.exports = connectDB; // Exporta a função connectDB para ser usada em outros módulos
