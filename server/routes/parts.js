import express from 'express';
import { executeQuery } from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateRequest, partCreateSchema } from '../middleware/validation.js';

const router = express.Router();

// Get parts with filtering and pagination, including by Company_Id
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search,
      category,
      focus_group,
      status = 'Active',
      order_pad_only,
      company_id
    } = req.query;

    let whereConditions = ['Item_Status = ?'];
    let queryParams = [status];

    if (search) {
      whereConditions.push('(Part_Number LIKE ? OR Part_Name LIKE ? OR Part_Application LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      whereConditions.push('Part_Catagory = ?');
      queryParams.push(category);
    }

    if (focus_group) {
      whereConditions.push('Focus_Group = ?');
      queryParams.push(focus_group);
    }

    if (order_pad_only === 'true') {
      whereConditions.push('Is_Order_Pad = 1');
    }

    if (company_id) {
      whereConditions.push('Company_Id = ?');
      queryParams.push(company_id);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM parts ${whereClause}`;
    const countResult = await executeQuery(countQuery, queryParams);
    const total = countResult[0].total;

    // Ensure limit and offset are always integers for MySQL
    const safeLimit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? parseInt(limit, 10) : 50;
    const safePage = Number.isInteger(Number(page)) && Number(page) > 0 ? parseInt(page, 10) : 1;
    const offset = (safePage - 1) * safeLimit;

    // Defensive: log and validate limit/page before using
    if (isNaN(safeLimit) || safeLimit <= 0) {
      console.error('Invalid limit value:', limit);
      return res.status(400).json({ error: 'Invalid limit value' });
    }
    if (isNaN(safePage) || safePage <= 0) {
      console.error('Invalid page value:', page);
      return res.status(400).json({ error: 'Invalid page value' });
    }

    // Get parts with pagination (inline LIMIT/OFFSET, not as placeholders)
    const partsQuery = `
      SELECT * FROM parts 
      ${whereClause}
      ORDER BY Part_Name ASC
      LIMIT ${safeLimit} OFFSET ${offset}
    `;

    // Only pass queryParams for WHERE conditions
    const parts = await executeQuery(partsQuery, queryParams);

    res.json({
      parts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get parts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get part by number
router.get('/:partNumber', authenticateToken, async (req, res) => {
  try {
    const partNumber = req.params.partNumber;

    // Join with category_master and category_master_pad for category info
    const partQuery = `
      SELECT 
        p.*,
        cm.category_id as category_id,
        cm.category_name as category_name,
        cmpad.category_id as order_pad_category_id,
        cmpad.category_name as order_pad_category_name
      FROM parts p
      LEFT JOIN category_master cm ON p.Part_Catagory = cm.category_name
      LEFT JOIN category_master_pad cmpad ON p.Order_Pad_Category = cmpad.category_id
      WHERE p.Part_Number = ?
    `;
    const parts = await executeQuery(partQuery, [partNumber]);

    if (parts.length === 0) {
      return res.status(404).json({ error: 'Part not found' });
    }

    // Return part with category info grouped
    const part = parts[0];
    res.json({
      ...part,
      part_category: {
        id: part.category_id,
        name: part.category_name
      },
      order_pad_category: {
        id: part.order_pad_category_id,
        name: part.order_pad_category_name
      }
    });
  } catch (error) {
    console.error('Get part error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new part (requires Company_Id)
router.post('/', 
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager'),
  validateRequest(partCreateSchema),
  async (req, res) => {
    try {
      const { Company_Id, ...rest } = req.body;
      if (!Company_Id) {
        return res.status(400).json({ error: 'Company_Id is required' });
      }
      const partData = {
        ...rest,
        Company_Id,
        Last_Sync: Date.now()
      };

      // Check if part already exists
      const existingParts = await executeQuery(
        'SELECT Part_Number FROM parts WHERE Part_Number = ?',
        [partData.Part_Number]
      );

      if (existingParts.length > 0) {
        return res.status(409).json({ error: 'Part number already exists' });
      }

      const fields = Object.keys(partData);
      const values = Object.values(partData);
      const placeholders = fields.map(() => '?').join(', ');

      const insertQuery = `
        INSERT INTO parts (${fields.join(', ')})
        VALUES (${placeholders})
      `;

      await executeQuery(insertQuery, values);

      res.status(201).json({
        message: 'Part created successfully',
        part_number: partData.Part_Number,
        company_id: partData.Company_Id
      });
    } catch (error) {
      console.error('Create part error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update part (allows updating Company_Id)
router.put('/:partNumber',
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager'),
  async (req, res) => {
    try {
      const partNumber = req.params.partNumber;
      const updateData = {
        ...req.body,
        Last_Sync: Date.now()
      };

      // Remove Part_Number from update data if present
      delete updateData.Part_Number;

      const fields = Object.keys(updateData);
      const values = Object.values(updateData);
      const setClause = fields.map(field => `${field} = ?`).join(', ');

      const updateQuery = `
        UPDATE parts 
        SET ${setClause}
        WHERE Part_Number = ?
      `;

      const result = await executeQuery(updateQuery, [...values, partNumber]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Part not found' });
      }

      res.json({ message: 'Part updated successfully' });
    } catch (error) {
      console.error('Update part error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update part stock levels
router.patch('/:partNumber/stock',
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager', 'storeman'),
  async (req, res) => {
    try {
      const partNumber = req.params.partNumber;
      const { T1, T2, T3, T4, T5 } = req.body;

      const updateQuery = `
        UPDATE parts 
        SET T1 = ?, T2 = ?, T3 = ?, T4 = ?, T5 = ?, Last_Sync = ?
        WHERE Part_Number = ?
      `;

      const result = await executeQuery(updateQuery, [
        T1 || 0, T2 || 0, T3 || 0, T4 || 0, T5 || 0,
        Date.now(),
        partNumber
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Part not found' });
      }

      res.json({ message: 'Stock levels updated successfully' });
    } catch (error) {
      console.error('Update stock error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get part categories
// Get all categories from category_master (main categories)
router.get('/meta/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await executeQuery(`
      SELECT category_id, category_name
      FROM category_master
      ORDER BY category_name
    `);
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all order pad categories from category_master_pad
router.get('/meta/order-pad-categories', authenticateToken, async (req, res) => {
  try {
    const padCategories = await executeQuery(`
      SELECT category_id, category_name, category_image, parent_id
      FROM category_master_pad
      ORDER BY category_name
    `);
    res.json(padCategories);
  } catch (error) {
    console.error('Get order pad categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get focus groups
router.get('/meta/focus-groups', authenticateToken, async (req, res) => {
  try {
    const focusGroups = await executeQuery(`
      SELECT DISTINCT Focus_Group as focus_group, COUNT(*) as count
      FROM parts 
      WHERE Focus_Group IS NOT NULL AND Focus_Group != ''
      GROUP BY Focus_Group
      ORDER BY Focus_Group
    `);

    res.json(focusGroups);
  } catch (error) {
    console.error('Get focus groups error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get low stock parts
router.get('/alerts/low-stock', 
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager', 'storeman'),
  async (req, res) => {
    try {
      const lowStockQuery = `
        SELECT 
          Part_Number,
          Part_Name,
          Part_MinQty,
          (T1 + T2 + T3 + T4 + T5) as total_stock,
          Part_Catagory,
          Focus_Group
        FROM parts 
        WHERE Item_Status = 'Active' 
        AND (T1 + T2 + T3 + T4 + T5) <= Part_MinQty
        ORDER BY (T1 + T2 + T3 + T4 + T5) ASC
      `;

      const lowStockParts = await executeQuery(lowStockQuery);

      res.json(lowStockParts);
    } catch (error) {
      console.error('Get low stock error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;