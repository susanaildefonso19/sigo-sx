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
      userOcorrencias.forEach((o, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `<a class="ocorrencia-link" data-idx="${idx}">${o.datahora.split('T')[0]} - ${o.tipo}</a>. ${o.localizacao}`;
        lista.appendChild(li);
      });

      // Evento para mostrar pop-up do mapa
      document.querySelectorAll('.ocorrencia-link').forEach(link => {
        link.addEventListener('click', function() {
          const idx = this.getAttribute('data-idx');
          const ocorrencia = userOcorrencias[idx];
          mostrarPopupMapa(ocorrencia);
        });
      });
    }
  } catch (err) {
    console.error('Erro ao listar as ocorrências do utilizador:', err);
  }
});

let mapPopup = null;

function mostrarPopupMapa(ocorrencia) {
  const popupDiv = document.getElementById('popup-mapa');
  const infoDiv = document.getElementById('info-popup-mapa');
  popupDiv.classList.remove('hidden');
  infoDiv.textContent = `${ocorrencia.tipo}`;

  setTimeout(() => {
    if (!mapPopup) {
      mapPopup = L.map('map-popup').setView([ocorrencia.lat, ocorrencia.lng], 15);

      L.tileLayer.wms("http://localhost:8080/geoserver/seixal/wms", {
        layers: 'seixal:mosaico_25cm',
        format: 'image/png',
        transparent: true,
        attribution: 'GeoServer - SIGO-SX'
      }).addTo(mapPopup);

      L.marker([ocorrencia.lat, ocorrencia.lng]).addTo(mapPopup);
    } else {
      mapPopup.setView([ocorrencia.lat, ocorrencia.lng], 15);
      mapPopup.eachLayer(layer => {
        if (layer instanceof L.Marker) mapPopup.removeLayer(layer);
      });
      L.marker([ocorrencia.lat, ocorrencia.lng]).addTo(mapPopup);
    }
  }, 100);
}


document.addEventListener('DOMContentLoaded', function() {
  const fecharBtn = document.getElementById('fechar-popup-mapa');
  if (fecharBtn) {
    fecharBtn.onclick = function() {
      document.getElementById('popup-mapa').classList.add('hidden');
      if (mapPopup) mapPopup.remove();
      mapPopup = null;
    };
  }
});

(function() {
  const popup = document.getElementById('popup-mapa');
  const handle = document.getElementById('info-popup-mapa'); // Usa o topo do popup como handle

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  if (popup && handle) {
    handle.style.cursor = 'move';

    handle.addEventListener('mousedown', function(e) {
      isDragging = true;
      // Calcula o offset do clique em relação ao canto do popup
      const rect = popup.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      popup.style.transition = 'none';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', function(e) {
      if (isDragging) {
        popup.style.left = (e.clientX - offsetX) + 'px';
        popup.style.top = (e.clientY - offsetY) + 'px';
        popup.style.transform = 'none'; // Remove o centrar automático
      }
    });

    document.addEventListener('mouseup', function() {
      isDragging = false;
      document.body.style.userSelect = '';
    });
  }
})();

