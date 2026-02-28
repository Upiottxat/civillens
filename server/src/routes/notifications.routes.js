const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { getMyNotifications } = require('../controllers/notifications.controller');

const router = Router();

router.use(authenticate);

router.get('/', getMyNotifications);

module.exports = router;
