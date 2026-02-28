const { Router } = require('express');
const { classify } = require('../controllers/classify.controller');

const router = Router();

// Classification is public — no auth needed (used in the reporting flow)
router.post('/', classify);

module.exports = router;
