# SIGO-SX - Sistema Integrado de Gestão de Ocorrências do Seixal

**SIGO-SX** é uma aplicação web desenvolvida no âmbito do Mestrado em Ciência e Sistemas de Informação Geográfica da NOVA IMS. O sistema tem como objetivo apoiar a **gestão municipal de ocorrências** no concelho do Seixal, com funcionalidades interativas baseadas em mapas e integração com serviços geoespaciais.

---

## 🔍 Funcionalidades principais

- 🌍 Mapa interativo em tela cheia (Leaflet.js)
- 📌 Registo de ocorrências georreferenciadas com clique no mapa
- 🗂️ Gestão e filtragem de ocorrências por tipo e ano
- 🗺️ Visualização codificada por cor segundo o tipo de ocorrência
- 🔐 Sistema de autenticação de utilizadores com JWT
- 📤 Exportação de dados em formatos **CSV** e **GeoJSON**
- 🌐 Backend com Node.js e Express, base de dados MongoDB
- 🛰️ Integração com serviços do GeoServer (WMS/WFS)

---

## 🧱 Estrutura do Projeto

```bash
progweb/
├── codigo/
│   ├── backend/                # API Node.js (Express)
│   │   ├── middlewares/        # Middleware (ex: verificação de token)
│   │   ├── models/             # Modelos de dados MongoDB
│   │   ├── routes/             # Rotas da API (utilizadores, ocorrências)
│   │   ├── controllers/        # Lógica de negócio
│   │   ├── services/           # Serviços auxiliares (JWT, exportações, etc.)
│   │   └── .env                # Variáveis de ambiente (configuração)
│   ├── frontend/               # Interface web (HTML, CSS, JS)
│   │   ├── index.html          # Página principal com mapa interativo
│   │   ├── about.html          # Página "Sobre"
│   │   ├── admin.html          # Interface de administração
│   │   ├── forgot.html         # Recuperação de palavra-passe
│   │   ├── register.html       # Registo de utilizadores
│   │   ├── user.html           # Página de utilizador
│   │   ├── js/                 # Scripts JavaScript
│   │   │   ├── app.js          # Lógica principal do mapa
│   │   │   ├── forgot.js       # Script para recuperação
│   │   │   ├── login.js        # Script de autenticação
│   │   │   └── user.js         # Lógica da página de utilizador
│   │   └── css/                # Estilos CSS
│   ├── assets/                 # Recursos estáticos (ícones, imagens)
│   ├── README.md               # Documentação do projeto
│   └── package.json            # Dependências do Node.js
└── relatorio/
    └── sigo-sx.pdf             # Relatório final do projeto


🚀 Tecnologias utilizadas

- Node.js	                    Backend da aplicação
- Express.js	                Framework web para a API REST
- MongoDB	                    Base de dados NoSQL
- Leaflet.js	                Biblioteca de mapas para o frontend
- GeoServer	                  Servidor de dados geoespaciais (WMS/WFS)
- JWT	                        Autenticação segura de utilizadores
- HTML/CSS/JS	                Estrutura e interatividade da interface
- Visual Studio Code	        Ambiente de desenvolvimento (IDE)
- Live Server	                Servidor local para desenvolvimento e debug
- Insomnia                    Testes e validação da API REST
- Nodemailer                  Envio automático de emails (ex. registo, recuperação de conta)

⚙️ Instalação local
Pré-requisitos:

Node.js (v18 ou superior)
MongoDB local ou MongoDB Atlas
GeoServer com camadas publicadas (WMS/WFS)
Insomnia para testar api

🟠 Passos:

bash
# Clonar o repositório
git clone https://github.com/seunome/sigo-sx.git
cd sigo-sx/codigo

# Instalar dependências do backend
cd backend
npm install

# Criar ficheiro de ambiente (.env)
touch .env

Adicionar as seguintes variáveis ao ficheiro .env:

ini
MONGODB_URI=<ligação à base de dados>
JWT_SECRET=<chave_secreta>
PORT=3000

bash
# Iniciar o servidor backend
npm start
# ou alternativamente
node server.js

Abrir o ficheiro frontend/index.html no navegador para testar a aplicação.

📦 Exportação de Dados
A API disponibiliza os seguintes endpoints para exportação de ocorrências:

/api/ocorrencias/export/csv → Ficheiro CSV

/api/ocorrencias/export/geojson → Ficheiro GeoJSON

🔒 Autenticação
O sistema utiliza JWT (JSON Web Tokens) para autenticação.
Os tokens são gerados no login e devem ser incluídos no cabeçalho Authorization das requisições autenticadas:

makefile

Authorization: Bearer <token>

🗃️ Exemplo de ocorrência (JSON)

json
{
  "tipo": "Inundação",
  "descricao": "Rua alagada após chuva intensa",
  "data": "2025-05-27T14:30:00Z",
  "coordenadas": {
    "lat": 38.640,
    "lng": -9.101
  },
  "ano": 2025,
  "utilizador": "admin"
}

🧪 Estado atual do desenvolvimento

✅ Registo e visualização de ocorrências
✅ Filtros por tipo e ano
✅ Exportação em CSV/GeoJSON
✅ Autenticação com JWT
✅ Interface de administração
🔄 Integração com GeoServer (em progresso)
🔄 Integração de camadas de risco em WMS 

👩‍💻 Autora
Susana Ildefonso
Mestrado em Ciência e Sistemas de Informação Geográfica
NOVA IMS - Information Management School

📄 Licença
Este projeto é de uso académico.
Caso pretenda reutilizar, adaptar ou expandir o sistema, por favor contacte a autora.
