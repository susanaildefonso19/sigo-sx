document.addEventListener('DOMContentLoaded', function() {
  // Se já está autenticado, mostra nome e botão logout
  const nome = localStorage.getItem('nome');
  if (nome) {
    document.getElementById('form-login').style.display = 'none';
    document.getElementById('user-info').style.display = 'block';
    document.getElementById('user-nome-header').textContent = `Bem-vindo, ${nome}`;
  }

  // Login
  document.getElementById('form-login').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const res = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        // Guarda token e dados do utilizador
        localStorage.setItem('token', data.token);
        localStorage.setItem('nome', data.user.nome);
        localStorage.setItem('email', data.user.email);
        localStorage.setItem('tipo', data.user.tipo);

        // Atualiza UI
        document.getElementById('form-login').style.display = 'none';
        document.getElementById('user-info').style.display = 'block';
        document.getElementById('user-nome-header').textContent = `Bem-vindo, ${data.user.nome}`;

        // Redireciona conforme o tipo de utilizador
        if (data.user.tipo === 'admin') {
          window.location.href = 'admin.html';
        } else {
          window.location.href = 'user.html';
        }
      } else {
        alert(data.msg || data.error || 'Login falhou.');
        document.getElementById('forgot-link').style.display = 'inline';
      }
    } catch (err) {
      alert('Erro ao comunicar com o servidor.');
    }
  });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', function() {
    localStorage.removeItem('token');
    localStorage.removeItem('nome');
    localStorage.removeItem('email');
    localStorage.removeItem('tipo');
    document.getElementById('user-info').style.display = 'none';
    document.getElementById('form-login').style.display = 'block';
    // Opcional: recarregar a página
    window.location.href = 'index.html';
  });

  // Mostrar menus conforme o tipo de utilizador
  const tipo = localStorage.getItem('tipo');
  if (tipo === 'admin') {
    document.querySelector('li[onclick*="admin.html"]').style.display = 'inline-block';
  }
  if (tipo === 'admin' || tipo === 'user') {
    document.querySelector('li[onclick*="user.html"]').style.display = 'inline-block';
  }
});