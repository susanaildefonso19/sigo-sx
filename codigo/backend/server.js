console.log("Server.js a correr com sucesso"); 

const dotenv = require("dotenv"); dotenv.config(); // Carrega as variáveis de ambiente do arquivo .env
const express = require('express'); // Importa o módulo express
const cors = require('cors'); // Importa o módulo cors para permitir requisições de diferentes origens
const connectDB = require('./services/database'); // Usa o serviço de ligação ao MongoDB
const userRoutes = require('./routes/userRoutes'); // Importa as rotas de utilizador
const Ocorrencia = require('./models/ocorrenciaModel'); // Importa o modelo de ocorrências

const app = express();
app.use(cors());
app.use(express.json());

// Conexão ao MongoDB
connectDB(); // Chama a função para ligar ao MongoDB


// Rotas de utilizador (registo, login, perfil, exportação CSV)
app.use('/api', userRoutes);

// Registar ocorrência
app.post('/api/ocorrencias', async (req, res) => {
  try {
    // Verifica se o ano foi fornecido, caso contrário, extrai do campo datahora
    console.log('🔍 API para [ocorrencias] a funcionar');
    if (!req.body.ano && req.body.datahora) {
      req.body.ano = new Date(req.body.datahora).getFullYear();
    }
    const ocorrencia = new Ocorrencia(req.body); // Cria uma nova ocorrência com os dados fornecidos no corpo da requisição
    await ocorrencia.save();
    res.status(201).json(ocorrencia);
  } catch (err) {
    console.error('❌ Erro ao obter ocorrencias:', err);
    res.status(400).json({ msg: 'Erro ao registar ocorrência.' });
  }
});

// Lista as ocorrências
app.get('/api/ocorrencias', async (req, res) => {
  try {
    const filtro = {};
    if (req.query.tipo) filtro.tipo = { $regex: new RegExp('^' + req.query.tipo + '$', 'i') }; // case-insensitive
    if (req.query.ano) filtro.ano = Number(req.query.ano);

    console.log('Filtro usado:', filtro); // Log do filtro usado para depuração

    const ocorrencias = await Ocorrencia.find(filtro);
    res.json(ocorrencias);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar ocorrências.' });
  }
});

// Obtém os anos únicos das ocorrências
app.get('/api/ocorrencias/anos', async (req, res) => {
  try {
    console.log('🔍 API para [anos] a funcionar');
    const anos = await Ocorrencia.distinct('ano');
    console.log('📆 Anos encontrados:', anos);
    anos.sort((a, b) => b - a); // Sort descending
    res.json(anos);
  } catch (err) {
    console.error('❌ Erro ao obter anos:', err);
    res.status(500).json({ error: 'Erro ao obter anos.' });
  }
});

// Obtém os tipos únicos de ocorrências
app.get('/api/ocorrencias/tipos', async (req, res) => {
  try {
    console.log('🔍 API para [tipos] a funcionar');
    const tipos = await Ocorrencia.distinct('tipo');
    console.log('📆 Tipos encontrados:', tipos);
    tipos.sort();
    res.json(tipos);
  } catch (err) {
    console.error('❌ Erro ao obter tipos:', err);
    res.status(500).json({ error: 'Erro ao obter tipos.' });
  }
});

// Endpoint de root para teste
app.get('/', (req, res) => {
  console.log('GET / chamada');
  res.send('API SIGO-SX em funcionamento!');
  console.log('🔍 API SIGO-SX a funcionar');
});

const PORT = 3001; // Define a porta onde o servidor irá escutar

app.listen(PORT, () => console.log(`Backend a correr em http://localhost:${PORT}`)); // Inicia o servidor e exibe mensagem no console


