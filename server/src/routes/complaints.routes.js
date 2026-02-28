const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const {
  submitComplaint,
  getMyComplaints,
  getComplaintById,
  getAllComplaints,
  updateStatus,
  uploadProof,
  assignComplaint,
} = require('../controllers/complaints.controller');

const router = Router();

// All complaint routes require authentication
router.use(authenticate);

// ─── Citizen routes ─────────────────────────────────────────────────────────
router.post('/', submitComplaint);
router.get('/mine', getMyComplaints);
router.get('/:id', getComplaintById);

// ─── Authority routes ───────────────────────────────────────────────────────
router.get('/', authorize('AUTHORITY', 'ADMIN'), getAllComplaints);
router.patch('/:id/status', authorize('AUTHORITY', 'ADMIN'), updateStatus);
router.patch('/:id/proof', authorize('AUTHORITY', 'ADMIN'), uploadProof);
router.patch('/:id/assign', authorize('AUTHORITY', 'ADMIN'), assignComplaint);

module.exports = router;
