const express    = require('express');
const router     = express.Router();
const { register, login, getMe, loginPin } = require('../controllers/auth.controller');
const protect    = require('../middleware/auth.middleware');

router.post('/register',  register);
router.post('/login',     login);
router.post('/login-pin', loginPin);  // Acceso de ninos con PIN de 4 digitos
router.get('/me',         protect, getMe);

module.exports = router;

