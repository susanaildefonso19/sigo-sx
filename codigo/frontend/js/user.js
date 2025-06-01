document.addEventListener('DOMContentLoaded', async function() {
  const nome = localStorage.getItem('nome');
  const email = localStorage.getItem('email');

  if (!nome || !email) {
    window.location.href = 'index.html';
    return;
  }

  // Preencher dados do utilizador
  if (document.getElementById('user-nome')) document.getElementById('user-nome').textContent = nome;
  if (document.getElementById('user-nome-dados')) document.getElementById('user-nome-dados').textContent = nome;
  if (document.getElementById('user-email')) document.getElementById('user-email').textContent = email;

  // Buscar ocorrências do backend
  try {
    const res = await fetch('http://localhost:3001/api/ocorrencias');
    const ocorrencias = res.ok ? await res.json() : [];
    const lista = document.getElementById('ocorrencias-lista');
    if (!lista) return;

    lista.innerHTML = '';

    const userOcorrencias = ocorrencias
      .filter(o => o.email === email)
      .sort((a, b) => new Date(b.datahora) - new Date(a.datahora))
      .slice(0, 5);

    if (userOcorrencias.length === 0) {
      lista.innerHTML = '<li>Sem ocorrências recentes.</li>';
    } else {
      userOcorrencias.forEach(o => {
        lista.innerHTML += `<li><b>${o.tipo}</b> - ${o.localizacao} (${o.datahora.split('T')[0]})</li>`;
      });
    }
  } catch (err) {
    console.error('Erro ao buscar ocorrências do utilizador:', err);
  }
});

