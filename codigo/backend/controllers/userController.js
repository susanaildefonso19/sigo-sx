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


const crypto = require('crypto');

exports.redefinePassword = async (req, res) => {
  try {
    const { nome, email } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email já registado.' });
    }

    // Gerar token de definição de password
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = Date.now() + 1000 * 60 * 60; // 1 hora

    const user = new User({ nome, email, resetToken, resetTokenExpires });
    await user.save();

    // Enviar email com link para definir password
    const link = `http://localhost:3000/setPassword.html?token=${resetToken}&email=${encodeURIComponent(email)}`;
    await emailService.sendMail({
      to: email,
      subject: 'Defina a sua password - SIGO-SX',
      text: `Olá ${nome},\n\nClique no link para definir a sua password:\n${link}\n\nSe não foi você, ignore este email.`,
      html: `<p>Olá <b>${nome}</b>,<br>Clique no link para definir a sua password:<br><a href="${link}">${link}</a></p>`
    });

    res.status(201).json({ msg: 'Registo efetuado. Verifique o seu email para definir a password.' });
  } catch (err) {
    res.status(400).json({ error: 'Erro ao registar utilizador.' });
  }
};

exports.setPassword = async (req, res) => {
  const { email, token, password } = req.body;
  try {
    const user = await User.findOne({ email, resetToken: token, resetTokenExpires: { $gt: Date.now() } });
    if (!user) {
      return res.status(400).json({ error: 'Token inválido ou expirado.' });
    }
    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    // Enviar email de confirmação
    await emailService.sendMail({
      to: email,
      subject: 'Password definida com sucesso - SIGO-SX',
      text: `Olá,\n\nA sua password foi definida com sucesso.\n\nSIGO-SX Team`
    });

    res.json({ msg: 'Password definida com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao definir password.' });
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
  const { email } = req.body;
  const crypto = require('crypto');
  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Não revelar se o email existe
      return res.json({ msg: 'Se o email existir, irá receber um link para recuperar a password.' });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpires = Date.now() + 1000 * 60 * 60; // 1 hora
    await user.save();

    const link = `http://localhost:3000/setPassword.html?token=${resetToken}&email=${encodeURIComponent(email)}`;
    await emailService.sendMail({
      to: email,
      subject: 'Recuperação de password - SIGO-SX',
      text: `Clique no link para definir uma nova password: ${link}`,
      html: `<p>Clique no link para definir uma nova password:<br><a href="${link}">${link}</a></p>`
    });

    res.json({ msg: 'Se o email existir, irá receber um link para recuperar a password.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar email de recuperação.' });
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