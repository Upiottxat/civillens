const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { getSummary, getSLAStats } = require('../controllers/dashboard.controller');

const router = Router();

// Dashboard is for authority / admin only
router.use(authenticate);
router.use(authorize('AUTHORITY', 'ADMIN'));

router.get('/summary', getSummary);
router.get('/sla-stats', getSLAStats);

module.exports = router;
