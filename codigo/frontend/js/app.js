console.log('App.js loaded');
console.log('Versão 1.0.0');
console.log('Desenvolvido por: Susana Ildefonso');

// Define os limites do mapa para a área de Seixal
const bounds = [
  [38.5397, -9.1789], // Sudoeste (SW)
  [38.6565, -9.0470]  // Nordeste (NE)
];

// Define o zoom mínimo do mapa (12 é o equivalente a 1:175000)
const minZoom = 12;

// Inicializa o mapa com os limites e zoom mínimo
const map = L.map('map', {
  maxBounds: bounds,
  maxBoundsViscosity: 1.0,
  minZoom: minZoom,
  zoomSnap: 0.1,
}).fitBounds(bounds);


L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
}).addTo(map); // Camada base do mapa com CartoDB Light


// Camadas do GeoServer via WMS
const ortos = L.tileLayer.wms("http://localhost:8080/geoserver/seixal/wms", {
  layers: 'seixal:mosaico_25cm', // workspace: seixal, nome da camada: mosaico_25cm
  format: 'image/png',
  transparent: true,
  attribution: 'GeoServer - SIGO-SX'
}).addTo(map);

const buffer = L.tileLayer.wms("http://localhost:8080/geoserver/seixal/wms", {
    layers: 'seixal:buffer_out', // workspace: seixal, nome da camada: buffer_out
    format: 'image/png',
    transparent: true,
    attribution: 'GeoServer - SIGO-SX'
}).addTo(map);

const freguesia = L.tileLayer.wms("http://localhost:8080/geoserver/seixal/wms", {
  layers: 'seixal:freguesias', // workspace:seixal, nome da camada: freguesias
  format: 'image/png',
  transparent: true,
  attribution: 'GeoServer - SIGO-SX'
}).addTo(map);

const concelho = L.tileLayer.wms("http://localhost:8080/geoserver/seixal/wms", {
  layers: 'seixal:seixal', // workspace:seixal, nome da camada: seixal
  format: 'image/png',
  transparent: true,
  attribution: 'GeoServer - SIGO-SX'
}).addTo(map);


let marker = null;
let concelhoGeoJSON = null;

// Helpers
function getYearColor(ano) {
    if (ano == 2023) return '#fcb603'; // amarelo
    if (ano == 2024) return '#488522'; // verde
    if (ano == 2025) return '#00778F'; // azul escuro
    return '#e06666'; // vermelho para anos desconhecidos
}

// Função para obter o ícone personalizado para as ocorrências
function getCustomIcon(color) {
    // Ícone SVG de localização (pin)
    return L.divIcon({
      className: 'custom-marker',
      html: `<svg width="28" height="36" viewBox="0 0 28 36"><path d="M14 2C7.4 2 2 7.4 2 14c0 7.5 10.2 19.1 11.1 20.1.5.6 1.3.6 1.8 0C15.8 33.1 26 21.5 26 14c0-6.6-5.4-12-12-12zm0 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" fill="${color}" stroke="#222" stroke-width="2"/></svg>`,
      iconSize: [28, 36],
      iconAnchor: [14, 36],
      popupAnchor: [0, -36]
    });
}

// Formatação de data para o formato DD.MM.AAAA
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
}

// Lógica de popups
function togglePopup(id) {
  document.querySelectorAll('.popup').forEach(p => p.classList.add('hidden'));
  const popup = document.getElementById(id);
  if (popup) {
    popup.classList.remove('hidden');
    if (id === 'popup-registo') {
      // Preencher data/hora automática
      const dataInput = document.getElementById('datahora');
      if (dataInput) {
        const agora = new Date();
        dataInput.value = agora.toLocaleString('pt-PT');
      }
    }
    if (id === 'popup-gestao') {
      renderOcorrenciasGestao();
    }
  }
  // Limpa markers se fechar o popup de gestão
  if (id !== 'popup-gestao' && window.gestaoMarkers) {
    window.gestaoMarkers.forEach(m => map.removeLayer(m));
    window.gestaoMarkers = [];
  }
}

// Registo por clique no mapa
map.on('click', function(e) {
  const registoPopup = document.getElementById('popup-registo');
  if (registoPopup.classList.contains('hidden')) return;

  const lat = e.latlng.lat;
  const lng = e.latlng.lng;

  // Apenas permite marcar dentro dos limites do concelho
  if (concelhoGeoJSON) {
    const pt = turf.point([lng, lat]);
    let inside = false;
    for (const feature of concelhoGeoJSON.features) {
      if (turf.booleanPointInPolygon(pt, feature)) {
        inside = true;
        break;
      }
    }
    if (!inside) {
      alert('Só pode marcar dentro dos limites do concelho.');
      return;
    }
  }
  // Atualiza os campos do formulário com as coordenadas
  document.querySelector('input[name="lat"]').value = lat;
  document.querySelector('input[name="lng"]').value = lng;

  // Atualiza o mapa com o novo marcador
  if (marker) map.removeLayer(marker);
  marker = L.marker([lat, lng]).addTo(map);
  
  fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
    .then(response => response.json())
    .then(data => {
      document.getElementById('localizacao').value = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    })
    .catch(() => {
      document.getElementById('localizacao').value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    });
});

// Submissão do formulário de ocorrência
document.getElementById('form-registo').addEventListener('submit', async function(e) {
  e.preventDefault();
  const tipo = this.tipo.value; 
  const descricao = this.descricao.value;
  const lat = Number(this.lat.value).toFixed(4);
  const lng = Number(this.lng.value).toFixed(4);
  const ano = new Date().getFullYear();
  const localizacao = this.localizacao.value;
  const datahora = new Date().toISOString();
  const email = localStorage.getItem('email') || 'anonimo';

  
  const ocorrencia = { tipo, descricao, lat, lng, ano, localizacao, datahora, email }; // Cria o objeto de ocorrência

  try {
    const res = await fetch('http://localhost:3001/api/ocorrencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ocorrencia)
    }); // Envia a ocorrência para o backend
    // Verifica se a resposta foi bem sucedida
    if (res.ok) {
      alert(`Ocorrência registada: ${tipo} em [${lat}, ${lng}]. \n Agradecemos a sua participação!`);
      this.reset();   // Limpa o formulário
      togglePopup(); // fecha popup
      if (marker) {
        map.removeLayer(marker);
        marker = null;
      }
      // Atualiza gestão se popup estiver aberto
      if (!document.getElementById('popup-gestao').classList.contains('hidden')) {
        renderOcorrenciasGestao();
      }
    } else {
      const data = await res.json();
      alert(data.msg || 'Erro ao registar ocorrência.');
    }
  } catch (err) {
    alert('Erro ao comunicar com o servidor.');
  }
});

// Procura o geoJSON do concelho de Seixal
fetch('http://localhost:8080/geoserver/seixal/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=seixal:seixal&outputFormat=application/json&srsName=EPSG:4326')
  .then(res => res.json())
  .then(data => {
    concelhoGeoJSON = data;
  });

  // Função para procurar ocorrências no backend
async function fetchOcorrencias(filtroPor = '', tipoFiltro = '', anoFiltro = '') {
  let url = 'http://localhost:3001/api/ocorrencias?';
  if (filtroPor === 'tipo' && tipoFiltro) {
    url += `tipo=${encodeURIComponent(tipoFiltro)}`;
  } else if (filtroPor === 'ano' && anoFiltro) {
    url += `ano=${encodeURIComponent(anoFiltro)}`;
  }
  const res = await fetch(url);
  if (!res.ok) return [];
  return await res.json();
}

// Renderizar ocorrências na gestão de ocorrências (sempre do backend)
async function renderOcorrenciasGestao() {
  const filtroPor = document.getElementById('filtro-por').value;
  const tipoFiltro = document.getElementById('filtro-tipo').value;
  const anoFiltro = document.getElementById('filtro-ano').value;
  const lista = document.getElementById('lista-ocorrencias');
  lista.innerHTML = '';

  // Limpar marcadores antigos
  if (window.gestaoMarkers) window.gestaoMarkers.forEach(m => map.removeLayer(m));
  window.gestaoMarkers = [];

  // Procurar ocorrências no backend
  const ocorrencias = await fetchOcorrencias(filtroPor, tipoFiltro, anoFiltro);

  // Cabeçalho da lista
  const header = document.createElement('li');
  header.innerHTML = `<span style="font-weight:bold;display:inline-block;width:110px">Data</span> <span style="font-weight:bold;">Ocorrência</span>`;
  header.style.borderBottom = "1px solid #ccc";
  header.style.marginBottom = "8px";
  header.style.marginTop = "8px";
  lista.appendChild(header);

  // Adicionar markers e listar só data e tipo, associando ao marker
  ocorrencias.forEach(o => {
    const data = formatDate(o.datahora);
    const marker = L.marker([o.lat, o.lng], {
      icon: getCustomIcon(getYearColor(o.ano))
    }).addTo(map).bindPopup(`<b>${o.tipo}</b><br>${o.localizacao}<br>${data}`);
    if (!window.gestaoMarkers) window.gestaoMarkers = [];
    window.gestaoMarkers.push(marker);

    const li = document.createElement('li');
    li.innerHTML = `<span style="display:inline-block;width:110px">${data}</span> <span><b>${o.tipo}</b></span>`;
    li.style.cursor = 'pointer';
    li.style.marginBottom = '10px';
    li.style.marginTop = '10px';
    li.onclick = function() {
      map.setView(marker.getLatLng(), 16, { animate: true });
      marker.openPopup();
    };
    lista.appendChild(li);
  });

  if (ocorrencias.length === 0) {
    lista.innerHTML += '<li>Sem ocorrências para os filtros selecionados.</li>';
  }
}

// Filtro dinâmico
document.getElementById('filtro-por').addEventListener('change', function() {
  document.getElementById('filtro-tipo').style.display = this.value === 'tipo' ? 'inline-block' : 'none';
  document.getElementById('filtro-ano').style.display = this.value === 'ano' ? 'inline-block' : 'none';
  renderOcorrenciasGestao();
});
document.getElementById('filtro-tipo').addEventListener('change', renderOcorrenciasGestao);
document.getElementById('filtro-ano').addEventListener('change', renderOcorrenciasGestao);

// Quando abrires o popup de gestão, chama renderOcorrenciasGestao()
document.addEventListener('DOMContentLoaded', function() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('popup') === 'registo') {
    if (typeof togglePopup === 'function') {
      togglePopup('popup-registo');
    } else {
      // Se togglePopup não estiver disponível imediatamente, tenta depois de um pequeno delay
      setTimeout(() => {
        if (typeof togglePopup === 'function') {
          togglePopup('popup-registo');
        }
      }, 500);
    }
  }
});

document.addEventListener('DOMContentLoaded', function() {
    // Só mostra se ainda não foi visto neste browser
    if (!sessionStorage.getItem('sigo_welcome_shown')) {
      const popup = document.getElementById('welcome-popup');
      if (popup) popup.style.display = 'block';
      document.getElementById('close-welcome').onclick = function() {
        popup.style.display = 'none';
        sessionStorage.setItem('sigo_welcome_shown', '1');
      };
    }
  });

document.addEventListener('DOMContentLoaded', async function () {
  // Populate anos
  const anoSelect = document.getElementById('filtro-ano');
  if (anoSelect) {
    try {
      const res = await fetch('http://localhost:3001/api/ocorrencias/anos');

      if (!res.ok) {
        throw new Error(`Erro na resposta: ${res.status}`);
      }

      const anos = await res.json();

      if (!Array.isArray(anos)) {
        throw new Error('Resposta não é um array!');
      }

      anoSelect.innerHTML = '<option value="">Todos os anos</option>';
      anos.forEach(ano => {
        anoSelect.innerHTML += `<option value="${ano}">${ano}</option>`;
      });
    } catch (err) {
      console.error('❌ Erro ao carregar anos:', err);
      anoSelect.innerHTML = '<option value="">Erro ao carregar anos</option>';
    }
  }
});

  // Populate tipos
  const tipoSelect = document.getElementById('filtro-tipo');
  if (tipoSelect) {
    const res = await fetch('http://localhost:3001/api/ocorrencias/tipos');
    const tipos = await res.json();
    tipoSelect.innerHTML = '<option value="">Todos os tipos</option>';
    tipos.forEach(tipo => {
      tipoSelect.innerHTML += `<option value="${tipo}">${tipo}</option>`;
    });
  }
});
