import express from 'express';
import { executeQuery, executeTransaction, pool } from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateRequest, orderCreateSchema } from '../middleware/validation.js';

const router = express.Router();

// Helper to transform order fields for frontend
function transformOrder(order) {
  return {
    ...order,
    Urgent_Status: order.Urgent_Status === 1 || order.Urgent_Status === true,
    IsSync: order.IsSync === 1 || order.IsSync === true,
    PO_Date: order.PO_Date ? Number(order.PO_Date) : undefined,
    Place_Date: order.Place_Date ? Number(order.Place_Date) : undefined,
    Confirm_Date: order.Confirm_Date ? Number(order.Confirm_Date) : undefined,
    Pick_Date: order.Pick_Date ? Number(order.Pick_Date) : undefined,
    Pack_Date: order.Pack_Date ? Number(order.Pack_Date) : undefined,
    Delivered_Date: order.Delivered_Date ? Number(order.Delivered_Date) : undefined,
    Last_Sync: order.Last_Sync ? Number(order.Last_Sync) : undefined,
  };
}

// Get orders with filtering and pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      urgent, 
      retailer_id, 
      branch,
      start_date,
      end_date 
    } = req.query;

    let whereConditions = [];
    let queryParams = [];

    // Role-based filtering with conflict-safe branch filter
    let branchAlreadyFiltered = false;

    if (req.user.role === 'retailer') {
      whereConditions.push('om.Retailer_Id = ?');
      queryParams.push(req.user.retailer_id);
    } else if (req.user.role !== 'super_admin') {
      if (req.user.store_id) {
        whereConditions.push('om.Branch = ?');
        queryParams.push(req.user.store_id);
        branchAlreadyFiltered = true;
      } else if (req.user.company_id) {
        whereConditions.push('s.company_id = ?');
        queryParams.push(req.user.company_id);
      }
    }

    if (branch && !branchAlreadyFiltered) {
      whereConditions.push('om.Branch = ?');
      queryParams.push(branch);
    }

    // Additional filters
    if (status) {
      whereConditions.push('om.Order_Status = ?');
      queryParams.push(status);
    }

    if (urgent !== undefined) {
      whereConditions.push('om.Urgent_Status = ?');
      queryParams.push(urgent === 'true' ? 1 : 0); // Convert string to boolean for MySQL
    }

    if (retailer_id) {
      whereConditions.push('om.Retailer_Id = ?');
      queryParams.push(retailer_id);
    }

    if (start_date) {
      whereConditions.push('om.Place_Date >= ?');
      queryParams.push(new Date(start_date).getTime());
    }

    if (end_date) {
      whereConditions.push('om.Place_Date <= ?');
      queryParams.push(new Date(end_date).getTime());
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM order_master om 
      LEFT JOIN stores s ON om.Branch = s.Branch_Code 
      ${whereClause}
    `;
    const countResult = await executeQuery(countQuery, queryParams);
    const total = countResult[0].total;


    const limitNum = parseInt(limit, 10);
    const pageNum = parseInt(page, 10);
    const offsetNum = (pageNum - 1) * limitNum;

    // Get orders (with item count)
    const ordersQuery = `
      SELECT 
        om.*,
        r.Retailer_Name,
        r.Contact_Person,
        s.Branch_Name,
        s.Company_Name,
        (
          SELECT COUNT(*) FROM order_items oi WHERE oi.Order_Id = om.Order_Id
        ) AS item_count
      FROM order_master om
      LEFT JOIN retailers r ON om.Retailer_Id = r.Retailer_Id
      LEFT JOIN stores s ON om.Branch = s.Branch_Code
      ${whereClause}
      ORDER BY om.Place_Date DESC
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `;

    const orders = await executeQuery(ordersQuery, queryParams);

    // For each order, fetch its items with category info (like /orders/:id, but only category fields)
    const orderIds = orders.map(o => o.Order_Id);
    let itemsByOrder = {};
    if (orderIds.length > 0) {
      // Get all items for these orders, with category info
      const itemsQuery = `
        SELECT 
          oi.Order_Id,
          oi.Order_Srl,
          oi.Part_Admin,
          oi.Order_Qty,
          p.Part_Name,
          p.Part_Catagory,
          cm.category_id as category_id,
          cm.category_name as category_name,
          p.Order_Pad_Category,
          cmpad.category_id as order_pad_category_id,
          cmpad.category_name as order_pad_category_name
        FROM order_items oi
        LEFT JOIN parts p ON oi.Part_Admin = p.Part_Number
        LEFT JOIN category_master cm ON p.Part_Catagory = cm.category_name
        LEFT JOIN category_master_pad cmpad ON p.Order_Pad_Category = cmpad.category_id
        WHERE oi.Order_Id IN (${orderIds.map(() => '?').join(',')})
        ORDER BY oi.Order_Id, oi.Order_Srl
      `;
      const items = await executeQuery(itemsQuery, orderIds);
      // Group by order
      itemsByOrder = items.reduce((acc, item) => {
        if (!acc[item.Order_Id]) acc[item.Order_Id] = [];
        acc[item.Order_Id].push({
          order_srl: item.Order_Srl,
          part_admin: item.Part_Admin,
          part_name: item.Part_Name,
          order_qty: item.Order_Qty,
          part_category: {
            id: item.category_id,
            name: item.category_name
          },
          order_pad_category: {
            id: item.order_pad_category_id,
            name: item.order_pad_category_name
          }
        });
        return acc;
      }, {});
    }

    res.json({
      orders: Array.isArray(orders)
        ? orders.map(o => ({
            ...transformOrder(o),
            item_count: o.item_count,
            items: itemsByOrder[o.Order_Id] || []
          }))
        : [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order by ID with items
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.id;

    // Get order details (with category info for parts)
    const orderQuery = `
      SELECT 
        om.*,
        r.Retailer_Name,
        r.Contact_Person,
        r.Retailer_Email,
        s.Branch_Name,
        s.Company_Name
      FROM order_master om
      LEFT JOIN retailers r ON om.Retailer_Id = r.Retailer_Id
      LEFT JOIN stores s ON om.Branch = s.Branch_Code
      WHERE om.Order_Id = ?
    `;

    const orders = await executeQuery(orderQuery, [orderId]);

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    // Check access permissions
    if (req.user.role === 'retailer' && order.Retailer_Id !== req.user.retailer_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get order items with inventory status and category info from the order's branch
    const itemsQuery = `
      SELECT 
        oi.*,
        p.Part_Name,
        p.Part_Image,
        p.Item_Status as part_status,
        p.Part_Catagory,
        cm.category_id as category_id,
        cm.category_name as category_name,
        p.Order_Pad_Category,
        cmpad.category_id as order_pad_category_id,
        cmpad.category_name as order_pad_category_name,
        ist.Part_A as stock_level_a,
        ist.Part_B as stock_level_b,
        ist.Part_C as stock_level_c,
        ist.Part_Max as max_stock,
        ist.Part_Rack as rack_location,
        ist.LastSale as last_sale_date,
        ist.LastPurchase as last_purchase_date,
        CASE 
          WHEN ist.Part_No IS NULL THEN 'Not Available'
          WHEN (COALESCE(ist.Part_A, 0) + COALESCE(ist.Part_B, 0) + COALESCE(ist.Part_C, 0)) <= 0 THEN 'Out of Stock'
          WHEN (COALESCE(ist.Part_A, 0) + COALESCE(ist.Part_B, 0) + COALESCE(ist.Part_C, 0)) < oi.Order_Qty THEN 'Insufficient Stock'
          ELSE 'Available'
        END as inventory_status,
        (COALESCE(ist.Part_A, 0) + COALESCE(ist.Part_B, 0) + COALESCE(ist.Part_C, 0)) as total_stock
      FROM order_items oi
      LEFT JOIN parts p ON oi.Part_Admin = p.Part_Number
      LEFT JOIN category_master cm ON p.Part_Catagory = cm.category_name
      LEFT JOIN category_master_pad cmpad ON p.Order_Pad_Category = cmpad.category_id
      LEFT JOIN item_status ist ON (oi.Part_Admin = ist.Part_No AND ist.Branch_Code = ?)
      WHERE oi.Order_Id = ?
      ORDER BY oi.Order_Srl
    `;

    const items = await executeQuery(itemsQuery, [order.Branch, orderId]);

    // Calculate inventory summary for the order
    const inventorySummary = {
      total_items: items.length,
      available_items: items.filter(item => item.inventory_status === 'Available').length,
      out_of_stock_items: items.filter(item => item.inventory_status === 'Out of Stock').length,
      insufficient_stock_items: items.filter(item => item.inventory_status === 'Insufficient Stock').length,
      not_available_items: items.filter(item => item.inventory_status === 'Not Available').length,
      can_fulfill: items.every(item => item.inventory_status === 'Available')
    };

    // Get order status history
    const statusHistoryQuery = `
      SELECT 
        id,
        order_id,
        status,
        previous_status,
        updated_by,
        updated_by_role,
        notes,
        timestamp,
        ip_address,
        user_agent
      FROM order_status_history
      WHERE order_id = ?
      ORDER BY timestamp ASC
    `;
    const status_history = await executeQuery(statusHistoryQuery, [orderId]);

    res.json({
      ...transformOrder(order),
      items,
      inventory_summary: inventorySummary,
      status_history
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new order
router.post('/', 
  authenticateToken, 
  authorizeRoles('admin', 'manager', 'storeman', 'salesman'),
  validateRequest(orderCreateSchema),
  async (req, res) => {
    try {
      const { retailer_id, po_number, urgent, remark, items, branch } = req.body;

      // Defensive: Ensure items is an array
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Order items must be an array.' });
      }

      // Generate CRM Order ID
      const year = new Date().getFullYear();
      const crmOrderId = `CRM-${year}-${Date.now().toString().slice(-6)}`;

      // Prepare order master data
      const placeDate = Date.now();
      const orderMasterQuery = `
        INSERT INTO order_master (
          CRMOrderId, Retailer_Id, Place_By, Place_Date, Order_Status,
          Branch, Remark, PO_Number, PO_Date, Urgent_Status, IsSync, Last_Sync
        ) VALUES (?, ?, ?, ?, 'New', ?, ?, ?, ?, ?, ?, ?)
      `;

      // Determine branch/store for order placement
      let branchToUse = branch;
      if (!branchToUse) {
        if (['salesman', 'retailer', 'storeman'].includes(req.user.role) && req.user.store_id) {
          branchToUse = req.user.store_id;
        } else if (['admin', 'manager'].includes(req.user.role)) {
          if (req.user.store_id) {
            branchToUse = req.user.store_id;
          } else {
            // If admin/manager and no store_id, require branch in request
            return res.status(400).json({ error: 'Store information is missing from your profile. Please select a store.' });
          }
        } else {
          branchToUse = 'UNKNOWN';
        }
      }

      const orderMasterParams = [
        crmOrderId,
        retailer_id,
        req.user.name,
        placeDate,
        branchToUse,
        remark || null,
        po_number || null,
        po_number ? placeDate : null,
        urgent ? 1 : 0, // Convert boolean to 0/1 for MySQL
        0, // IsSync
        placeDate
      ];

      // Prepare order items data
      const orderItemQueries = items.map((item, index) => {
        const itemAmount = Math.round(
          item.mrp * item.quantity * 
          (1 - (item.basic_discount + item.scheme_discount + item.additional_discount) / 100)
        );

        return {
          query: `
            INSERT INTO order_items (
              Order_Id, Order_Srl, Part_Admin, Part_Salesman, Order_Qty,
              Dispatch_Qty, OrderItemStatus, PlaceDate, RetailerId,
              ItemAmount, SchemeDisc, AdditionalDisc, Discount, MRP,
              FirstOrderDate, Urgent_Status, Last_Sync
            ) VALUES (?, ?, ?, ?, ?, 0, 'New', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          params: [
            null, // Will be set after order creation
            index + 1,
            item.part_number,
            item.part_name || item.part_number,
            item.quantity,
            placeDate,
            retailer_id,
            itemAmount,
            item.scheme_discount || 0,
            item.additional_discount || 0,
            item.basic_discount || 0,
            item.mrp,
            placeDate,
            item.urgent ? 1 : 0, // Convert boolean to 0/1 for MySQL
            placeDate
          ]
        };
      });

      // Execute transaction
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Insert order master
        const [orderResult] = await connection.execute(orderMasterQuery, orderMasterParams);
        const orderId = orderResult.insertId;

        // Insert order items
        for (const itemQuery of orderItemQueries) {
          itemQuery.params[0] = orderId; // Set Order_Id
          await connection.execute(itemQuery.query, itemQuery.params);
        }

        await connection.commit();

        // Get the created order with details
        const createdOrder = await executeQuery(`
          SELECT 
            om.*,
            r.Retailer_Name,
            r.Contact_Person
          FROM order_master om
          LEFT JOIN retailers r ON om.Retailer_Id = r.Retailer_Id
          WHERE om.Order_Id = ?
        `, [orderId]);

        res.status(201).json({
          message: 'Order created successfully',
          order: createdOrder[0]
        });

      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update order status - Use order-status-history for comprehensive tracking
router.patch('/:id/status', 
  authenticateToken,
  authorizeRoles('admin', 'manager', 'storeman'),
  async (req, res) => {
    try {
      const orderId = req.params.id;
      const { status, notes } = req.body;

      const validStatuses = ['New', 'Pending', 'Processing', 'Picked', 'Dispatched', 'Completed', 'Hold', 'Cancelled'];
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      // Get current order status for validation
      const currentOrder = await executeQuery('SELECT Order_Status FROM order_master WHERE Order_Id = ?', [orderId]);
      if (!currentOrder.length) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const previousStatus = currentOrder[0].Order_Status;

      // Validate status transition
      const validTransitions = {
        'New': ['Pending', 'Hold', 'Cancelled'],
        'Pending': ['Processing', 'Hold', 'Cancelled'],
        'Processing': ['Picked', 'Hold', 'Cancelled'],
        'Hold': ['New', 'Pending', 'Processing', 'Picked', 'Dispatched', 'Completed', 'Cancelled'],
        'Picked': ['Dispatched', 'Hold'],
        'Dispatched': ['Completed'],
        'Completed': [],
        'Cancelled': []
      };

      if (!validTransitions[previousStatus]?.includes(status)) {
        return res.status(400).json({ 
          error: `Invalid status transition from ${previousStatus} to ${status}` 
        });
      }

      // Use transaction to update both order_master and order_status_history
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        const currentTime = Date.now();
        const userId = req.user.id;
        const userName = req.user.name;
        const userRole = req.user.role;

        // Update order master status
        const updateFields = ['Order_Status = ?', 'Last_Sync = ?'];
        const updateParams = [status, currentTime];

        // Add status-specific fields
        switch (status) {
          case 'Processing':
            updateFields.push('Confirm_By = ?', 'Confirm_Date = ?');
            updateParams.push(userName, currentTime);
            break;
          case 'Picked':
            updateFields.push('Pick_By = ?', 'Pick_Date = ?');
            updateParams.push(userName, currentTime);
            break;
          case 'Dispatched':
            updateFields.push('Pack_By = ?', 'Pack_Date = ?');
            updateParams.push(userName, currentTime);
            break;
          case 'Completed':
            updateFields.push('Delivered_By = ?', 'Delivered_Date = ?');
            updateParams.push(userName, currentTime);
            break;
        }

        if (notes) {
          updateFields.push('Remark = ?');
          updateParams.push(notes);
        }

        updateParams.push(orderId);

        const updateQuery = `
          UPDATE order_master 
          SET ${updateFields.join(', ')}
          WHERE Order_Id = ?
        `;

        await connection.execute(updateQuery, updateParams);

        // Insert status history record
        await connection.execute(`
          INSERT INTO order_status_history 
          (order_id, status, previous_status, updated_by, updated_by_role, notes, timestamp, ip_address, user_agent)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          orderId,
          status,
          previousStatus,
          userId,
          userRole,
          notes || `Status updated to ${status}`,
          currentTime,
          req.ip,
          req.get('User-Agent')
        ]);

        await connection.commit();
        connection.release();

        res.json({ 
          message: 'Order status updated successfully',
          data: {
            orderId,
            status,
            previousStatus,
            updatedBy: userName
          }
        });

      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }

    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get order statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    let whereCondition = '';
    let queryParams = [];

    // Role-based filtering
    if (req.user.role === 'retailer') {
      whereCondition = 'WHERE om.Retailer_Id = ?';
      queryParams.push(req.user.retailer_id);
    } else if (req.user.role !== 'super_admin') {
      if (req.user.store_id) {
        whereCondition = 'WHERE om.Branch = ?';
        queryParams.push(req.user.store_id);
      } else if (req.user.company_id) {
        whereCondition = 'WHERE s.company_id = ?';
        queryParams.push(req.user.company_id);
      }
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN om.Order_Status = 'New' THEN 1 ELSE 0 END) as new_orders,
        SUM(CASE WHEN om.Order_Status = 'Processing' THEN 1 ELSE 0 END) as processing_orders,
        SUM(CASE WHEN om.Order_Status = 'Completed' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN om.Urgent_Status = TRUE THEN 1 ELSE 0 END) as urgent_orders,
        COUNT(DISTINCT om.Retailer_Id) as unique_retailers
      FROM order_master om
      LEFT JOIN stores s ON om.Branch = s.Branch_Code
      ${whereCondition}
    `;

    const stats = await executeQuery(statsQuery, queryParams);

    res.json(stats[0]);
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
