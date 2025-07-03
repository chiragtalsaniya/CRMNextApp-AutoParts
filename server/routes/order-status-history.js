import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get order status history for a specific order
router.get('/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const [rows] = await pool.execute(`
      SELECT 
        osh.*,
        u.name as updated_by_name,
        u.email as updated_by_email
      FROM order_status_history osh
      LEFT JOIN users u ON osh.updated_by = u.id
      WHERE osh.order_id = ?
      ORDER BY osh.timestamp ASC
    `, [orderId]);

    // Transform the data to match your frontend format
    const statusHistory = rows.map(row => ({
      id: row.id,
      status: row.status,
      previousStatus: row.previous_status,
      timestamp: new Date(parseInt(row.timestamp)).toISOString(),
      updatedBy: row.updated_by_name || row.updated_by,
      updatedByRole: row.updated_by_role,
      notes: row.notes,
      systemGenerated: row.system_generated,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    }));

    res.json({
      success: true,
      data: statusHistory
    });
  } catch (error) {
    console.error('Error fetching order status history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order status history'
    });
  }
});

// Get order status statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const { timeframe = '30' } = req.query; // days
    const timestamp = Date.now() - (parseInt(timeframe) * 24 * 60 * 60 * 1000);

    const [stats] = await pool.execute(`
      SELECT 
        status,
        COUNT(*) as count,
        COUNT(DISTINCT order_id) as unique_orders
      FROM order_status_history 
      WHERE timestamp >= ?
      GROUP BY status
      ORDER BY count DESC
    `, [timestamp]);

    const [transitions] = await pool.execute(`
      SELECT 
        previous_status,
        status,
        COUNT(*) as transition_count
      FROM order_status_history 
      WHERE timestamp >= ? AND previous_status IS NOT NULL
      GROUP BY previous_status, status
      ORDER BY transition_count DESC
    `, [timestamp]);

    res.json({
      success: true,
      data: {
        statusCounts: stats,
        transitions,
        timeframe: parseInt(timeframe)
      }
    });

  } catch (error) {
    console.error('Error fetching status statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch status statistics'
    });
  }
});

export default router;
