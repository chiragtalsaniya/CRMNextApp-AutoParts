import express from 'express';
import { pool } from '../config/database.js';

const router = express.Router();

// Get all transport records
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM transport ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transport by id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM transport WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new transport
router.post('/', async (req, res) => {
  try {
    const { store_id, type, provider, contact_number } = req.body;
    const [result] = await pool.query(
      'INSERT INTO transport (store_id, type, provider, contact_number) VALUES (?, ?, ?, ?)',
      [store_id, type, provider, contact_number]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update transport
router.put('/:id', async (req, res) => {
  try {
    const { store_id, type, provider, contact_number } = req.body;
    await pool.query(
      'UPDATE transport SET store_id = ?, type = ?, provider = ?, contact_number = ? WHERE id = ?',
      [store_id, type, provider, contact_number, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete transport
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM transport WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
