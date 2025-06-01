const nodemailer = require('nodemailer'); // Importa o módulo nodemailer para enviar emails

// Configuração do transportador de email usando o serviço Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'susanaildefonso19@gmail.com',
    pass: 'srdi hxej uuuu xgse'
  }
}); // Configura o serviço de email e as credenciais de autenticação

async function sendMail({ to, subject, text, html }) {
  return transporter.sendMail({
    from: '"SIGO-SX" <susanaildefonso19@gmail.com>',
    to,
    subject,
    text,
    html
  });
} // Função para enviar emails, recebe um objeto com os detalhes do email

module.exports = { sendMail }; // Exporta a função sendMail para ser usada em outros módulos