const nodemailer = require('nodemailer');
require('dotenv').config(); // Adiciona esta linha

// Configuração do transportador de email usando o serviço Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Usa variável de ambiente
    pass: process.env.EMAIL_PASS  // Usa variável de ambiente
  }
}); // Configura o serviço de email e as credenciais de autenticação

async function sendMail({ to, subject, text, html }) {
  try {
    const info = await transporter.sendMail({
      from: '"SIGO-SX" <susanaildefonso19@gmail.com>',
      to,
      subject,
      text,
      html
    });
    console.log(`Email enviado com sucesso para ${to}: ${info.messageId}`);
    console.log('Detalhes do envio:', info);
    return info;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw error;
  }
} // Função para enviar emails, recebe um objeto com os detalhes do email

module.exports = { sendMail }; // Exporta a função sendMail para ser usada em outros módulos


transporter.verify(function(error, success) {
  if (error) {
    console.log('Erro na configuração do transporter:', error);
  } else {
    console.log('Servidor pronto para enviar mensagens');
  }
});