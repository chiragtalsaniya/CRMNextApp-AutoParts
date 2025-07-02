const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// PATCH /orders/:id/status
router.patch('/:id/status', authenticateToken, authorizeRoles('admin', 'manager', 'storeman'), async (req, res) => {
  const { status, notes } = req.body;
  const validStatuses = [
    'New', 'Pending', 'Processing', 'Hold', 'Picked', 'Dispatched', 'Completed', 'Cancelled'
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  // TODO: Implement DB update for order status and audit log
  // Use req.user for audit trail
  return res.json({ success: true });
});

module.exports = router;
