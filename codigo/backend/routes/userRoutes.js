const express = require('express'); // Importa o módulo express
const router = express.Router(); // Cria um roteador para definir as rotas relacionadas a utilizadores
const userController = require('../controllers/userController'); // Importa o controlador de utilizadores
const authMiddleware = require('../middlewares/authMiddleware'); // Importa o middleware de autenticação

// Rota para registo
router.post('/register', userController.registerUser);

// Rota para login
router.post('/login', userController.loginUser);

// Rota para obter perfil
router.get('/me', authMiddleware, userController.getUserProfile);

// Rota para exportar CSV (apenas admin)
router.get('/export-csv', authMiddleware, userController.exportOcorrenciasCSV);

// Rota para exportar GeoJSON (apenas admin)
router.get('/export-geojson', authMiddleware, userController.exportOcorrenciasGeoJSON);

// Rota para reset de password (a implementar)
router.post('/reset-password', userController.resetPassword);

// Editar ocorrência
router.put('/ocorrencias/:id', userController.updateOcorrencia);
// Apagar ocorrência
router.delete('/ocorrencias/:id', userController.deleteOcorrencia);

// Listar utilizadores (apenas admin)
router.get('/users', authMiddleware, userController.listUsers);
// Editar utilizador
router.put('/users/:id', authMiddleware, userController.updateUser);
// Apagar utilizador
router.delete('/users/:id', authMiddleware, userController.deleteUser);

module.exports = router; // Exporta o roteador para uso no servidor principal
