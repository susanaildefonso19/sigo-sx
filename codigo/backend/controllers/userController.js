// Importações de módulos e dependências:
const bcrypt = require('bcryptjs'); // Importa o módulo para encriptação de palavras-passe.
const jwt = require('jsonwebtoken'); // Importa o módulo para criar e verificar tokens JWT (autenticação).
const User = require('../models/userModel'); 
const Ocorrencia = require('../models/ocorrenciaModel'); // Importa os modelos Mongoose para utilizadores e ocorrências (MongoDB).
const { Parser } = require('json2csv'); // Permite converter dados JSON para CSV.
const emailService = require('../services/emailService'); //Serviço responsável por enviar emails, como na recuperação de password.

// Registar utilizador
exports.registerUser = async (req, res) => {
  try {
    const { nome, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email já registado.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ nome, email, password: hashedPassword });
    await user.save();

    // Enviar email de confirmação
    await emailService.sendMail({
      to: email,
      subject: '🎉 Bem-vindo(a) à SIGO-SX!',
      text: `Olá ${nome},\n\nO seu registo foi efetuado com sucesso!`,
      html: `<p>Olá <b>${nome}</b>,</p>
            <p>Obrigado por se registar na <b>SIGO-SX</b> – a sua nova ferramenta de apoio à gestão e planeamento territorial!</p>
            <p>A partir de agora, tem acesso a uma plataforma desenvolvida para facilitar a análise, partilha e visualização de informação geográfica de forma simples e eficiente.</p>
            <p><b>Estamos muito contentes por tê-lo connosco e esperamos que a SIGO-SX seja um recurso valioso no seu dia a dia profissional.</b></p>
            <p>🔹 <b>Comece já:</b> Aceda à sua área pessoal, explore os mapas interativos e descubra as funcionalidades disponíveis.<br>
            🔹 <b>Precisa de ajuda?</b> Consulte o nosso centro de suporte ou contacte-nos diretamente através da aplicação.<br>
            🔹 <b>Fique atento(a):</b> Em breve, receberá novidades, dicas de utilização e atualizações diretamente no seu e-mail.</p>
            <p>Se tiver alguma dúvida ou sugestão, não hesite em entrar em contacto connosco.</p>
            <p><b>Bem-vindo(a) à comunidade SIGO-SX!</b></p>
            <p>Com os melhores cumprimentos,
            
            <br>A equipa SIGO-SX</p>`

    });

    res.status(201).json({ msg: 'Utilizador registado com sucesso.' });
  } catch (err) {
    res.status(400).json({ error: 'Erro ao registar utilizador.' });
  }
};

// Login do utilizador
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }); // Procura o utilizador pelo email
    if (!user) return res.status(400).json({ msg: 'Utilizador não encontrado.' }); // Se não encontrar, retorna erro.

    const match = await bcrypt.compare(password, user.password); // Compara a password fornecida com a armazenada
    if (!match) return res.status(401).json({ msg: 'Palavra-passe incorreta.' }); // Se não corresponder, retorna erro.

    // Atualiza o último acesso
    user.ultimoAcesso = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, 'segredo_sigo', { expiresIn: '1d' }); // Cria um token JWT com o ID do utilizador e uma chave secreta, válido por 1 dia.

    res.json({ token, user: { id: user._id, nome: user.nome, email: user.email, tipo: user.tipo } }); // Retorna o token e os dados do utilizador (sem a password).
  } catch (err) {
    res.status(500).json({ msg: 'Erro ao fazer login.' });
  } // Se ocorrer um erro, retorna mensagem de erro.
};

// Obter perfil autenticado
exports.getUserProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
}; // Retorna os dados do utilizador autenticado, excluindo a password.

// Exportar ocorrências em CSV
exports.exportOcorrenciasCSV = async (req, res) => { // Apenas administradores podem exportar.
  if (req.user.tipo !== 'admin') {
    return res.status(403).json({ msg: 'Acesso negado.' });
  }
  const filtro = {};
  if (req.query.tipo) filtro.tipo = req.query.tipo;
  if (req.query.ano) filtro.ano = Number(req.query.ano); // Filtra por tipo e ano se fornecidos.

  // Exclui o campo email diretamente na query
  const ocorrencias = await Ocorrencia.find(filtro).select('-email');

  // Prepara os dados para exportação
  const dadosCSV = ocorrencias.map(o => ({
    id: o._id,
    lat: o.lat,
    lng: o.lng,
    tipo: o.tipo,
    data: o.datahora ? new Date(o.datahora).toLocaleDateString('pt-PT') : '',
    hora: o.datahora ? new Date(o.datahora).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '',
    descricao: o.descricao || ''
  }));

  // Converte os dados para CSV
  const parser = new Parser({
    fields: ['id', 'lat', 'lng', 'tipo', 'data', 'hora', 'descricao']
  });
  const csv = parser.parse(dadosCSV);
  // Envia o ficheiro CSV para download
  res.header('Content-Type', 'text/csv');
  res.attachment('ocorrencias.csv');
  return res.send(csv);
};

// Exportar ocorrências em GeoJSON
exports.exportOcorrenciasGeoJSON = async (req, res) => {
  if (req.user.tipo !== 'admin') {
    return res.status(403).json({ msg: 'Acesso negado.' });
  }
  const filtro = {};
  if (req.query.tipo) filtro.tipo = req.query.tipo;
  if (req.query.ano) filtro.ano = Number(req.query.ano);

  // Constrói a estrutura GeoJSON
  const ocorrencias = await Ocorrencia.find(filtro).select('-email');
  const geojson = {
    type: "FeatureCollection",
    features: ocorrencias.map(o => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [o.lng, o.lat]
      },
      properties: {
        id: o._id,
        lat: o.lat,
        lng: o.lng,
        tipo: o.tipo,
        data: o.datahora ? new Date(o.datahora).toLocaleDateString('pt-PT') : '',
        hora: o.datahora ? new Date(o.datahora).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '',
        descricao: o.descricao || ''
      }
    }))
  };
  // Envia o ficheiro GeoJSON para download
  res.header('Content-Type', 'application/geo+json');
  res.attachment('ocorrencias.geojson');
  res.send(JSON.stringify(geojson, null, 2));
};

// Reset de password
// Atualiza a password com nova encriptação.
exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Email não encontrado.' });
    }
    // Gera o hash da nova password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    // Envia email de confirmação
    await emailService.sendMail({
      to: email,
      subject: 'Password alterada - SIGO-SX',
      text: `Olá,\n\nA sua password foi alterada com sucesso.\n\nSe não foi você, contacte o suporte.\n\nSIGO-SX Team`,
    });
    res.json({ message: 'Password alterada com sucesso. Email de confirmação enviado.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar email de confirmação.' });
  }
};

// Editar ocorrência
//  Atualiza uma ocorrência com novos dados
exports.updateOcorrencia = async (req, res) => {
  try {
    const ocorrencia = await Ocorrencia.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ocorrencia) return res.status(404).json({ msg: 'Ocorrência não encontrada.' });
    res.json(ocorrencia);
  } catch (err) {
    res.status(500).json({ msg: 'Erro ao editar ocorrência.' });
  }
};

// Apagar ocorrência
// Remove uma ocorrência pelo ID
exports.deleteOcorrencia = async (req, res) => {
  try {
    const ocorrencia = await Ocorrencia.findByIdAndDelete(req.params.id);
    if (!ocorrencia) return res.status(404).json({ msg: 'Ocorrência não encontrada.' });
    res.json({ msg: 'Ocorrência apagada com sucesso.' });
  } catch (err) {
    res.status(500).json({ msg: 'Erro ao apagar ocorrência.' });
  }
};

// Listar utilizadores (apenas admin)
// Lista todos os utilizadores, excluindo a password
exports.listUsers = async (req, res) => {
  if (req.user.tipo !== 'admin') {
    return res.status(403).json({ msg: 'Acesso negado.' });
  }
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Erro ao listar utilizadores.' });
  }
};

// Editar utilizador (apenas admin)
// Atualiza os dados de um utilizador pelo ID
exports.updateUser = async (req, res) => {
  if (req.user.tipo !== 'admin') {
    return res.status(403).json({ msg: 'Acesso negado.' });
  }
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    if (!user) return res.status(404).json({ msg: 'Utilizador não encontrado.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Erro ao editar utilizador.' });
  }
};

// Apagar utilizador (apenas admin)
// Remove um utilizador pelo ID
exports.deleteUser = async (req, res) => {
  if (req.user.tipo !== 'admin') {
    return res.status(403).json({ msg: 'Acesso negado.' });
  }
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ msg: 'Utilizador não encontrado.' });
    res.json({ msg: 'Utilizador apagado com sucesso.' });
  } catch (err) {
    res.status(500).json({ msg: 'Erro ao apagar utilizador.' });
  }
};

// Criar ocorrência
// Regista uma nova ocorrência a partir dos dados fornecidos
exports.createOcorrencia = async (req, res) => {
  try {
    const ocorrencia = new Ocorrencia(req.body);
    await ocorrencia.save();
    res.status(201).json(ocorrencia);
  } catch (err) {
    res.status(400).json({ msg: 'Erro ao registar ocorrência.' });
  }
};

// Listar ocorrências
// Retorna lista de ocorrências, com possibilidade de filtragem por tipo e ano
exports.listOcorrencias = async (req, res) => {
  const filtro = {};
  if (req.query.tipo) filtro.tipo = req.query.tipo;
  if (req.query.ano) filtro.ano = Number(req.query.ano);
  const ocorrencias = await Ocorrencia.find(filtro);
  res.json(ocorrencias);
};