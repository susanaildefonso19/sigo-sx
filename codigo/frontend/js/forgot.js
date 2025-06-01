document.getElementById('forgotForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const email = document.getElementById('forgot-email').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (newPassword !== confirmPassword) {
    alert('As passwords não coincidem.');
    return;
  }

  const res = await fetch('http://localhost:3001/api/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, newPassword })
  });
  const data = await res.json();
  if (res.ok) {
    alert('Password alterada com sucesso! Vai receber um email de confirmação.');
    window.location.href = 'index.html';
  } else {
    alert(data.error || 'Erro ao alterar a password.');
  }
});
