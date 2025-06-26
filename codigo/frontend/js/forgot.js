document.getElementById('forgotForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const email = document.getElementById('forgot-email').value;

  const res = await fetch('http://localhost:3001/api/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  if (res.ok) {
    console.log('Email de recuperação enviado:', data);
    alert('Se o email existir, irá receber um link para recuperar a password.');
    window.location.href = 'index.html';
  } else {
    alert(data.error || 'Erro ao enviar email de recuperação.');
  }
});
