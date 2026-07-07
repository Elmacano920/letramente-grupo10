const express    = require('express');
const router     = express.Router();
const { register, login, getMe, loginPin } = require('../controllers/auth.controller');
const { childLogin } = require('../controllers/ninos.controller');
const protect    = require('../middleware/auth.middleware');

router.post('/register',    register);
router.post('/login',       login);
router.post('/login-pin',   loginPin);        // legado — mantenido por compatibilidad
router.post('/child-login', childLogin);      // v3.1 — acceso directo sin PIN
router.get('/me',           protect, getMe);

module.exports = router;

