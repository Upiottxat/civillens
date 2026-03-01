const { Router } = require('express');
const { authorityLogin, authorityRegister } = require('../controllers/auth.authority.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { getMe } = require('../controllers/auth.controller');

const router = Router();

router.post('/login', authorityLogin);
router.post('/register', authorityRegister);
router.get('/me', authenticate, getMe);

module.exports = router;
