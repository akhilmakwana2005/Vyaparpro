import PurchaseOrder from '../models/PurchaseOrder.js';
import Product from '../models/Product.js';
import { logActivity } from '../utils/logger.js';

// @desc    Get all POs for a user
// @route   GET /api/purchase-orders
// @access  Private
export const getPurchaseOrders = async (req, res) => {
  try {
    const pos = await PurchaseOrder.find({ user: req.businessOwnerId }).sort({ createdAt: -1 });
    res.json(pos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single PO
// @route   GET /api/purchase-orders/:id
// @access  Private
export const getPurchaseOrderById = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (po && po.user.toString() === req.businessOwnerId.toString()) {
      res.json(po);
    } else {
      res.status(404).json({ message: 'Purchase order not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new PO
// @route   POST /api/purchase-orders
// @access  Private
export const createPurchaseOrder = async (req, res) => {
  try {
    const { poNumber, supplierName, supplierContact, items, totalAmount, status, expectedDate, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in purchase order' });
    }

    const po = new PurchaseOrder({
      user: req.businessOwnerId,
      poNumber,
      supplierName,
      supplierContact,
      items,
      totalAmount,
      status: status || 'Pending',
      expectedDate,
      notes,
    });

    const created = await po.save();

    await logActivity(req, `Created Purchase Order: ${created.poNumber}`, 'PurchaseOrders', `Supplier: ${supplierName}, Total: ₹${totalAmount}`);

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update PO status (incl. mark as Received → auto-increment stock)
// @route   PUT /api/purchase-orders/:id
// @access  Private
export const updatePurchaseOrder = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po || po.user.toString() !== req.businessOwnerId.toString()) {
      return res.status(404).json({ message: 'Purchase order not found or unauthorized' });
    }

    const prevStatus = po.status;
    const newStatus = req.body.status || po.status;

    // Auto-increment stock only when transitioning TO "Received"
    if (newStatus === 'Received' && prevStatus !== 'Received') {
      for (const item of po.items) {
        if (item.product) {
          const product = await Product.findById(item.product);
          if (product) {
            product.stock = product.stock + item.quantity;
            await product.save();
          }
        }
      }
    }

    po.status = newStatus;
    if (req.body.notes !== undefined) po.notes = req.body.notes;
    if (req.body.expectedDate !== undefined) po.expectedDate = req.body.expectedDate;

    const updated = await po.save();

    await logActivity(req, `Updated Purchase Order: ${updated.poNumber}`, 'PurchaseOrders', `Status changed to: ${updated.status}`);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete / Cancel a PO
// @route   DELETE /api/purchase-orders/:id
// @access  Private
export const deletePurchaseOrder = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po || po.user.toString() !== req.businessOwnerId.toString()) {
      return res.status(404).json({ message: 'Purchase order not found or unauthorized' });
    }

    // If PO was already received, deduct stock back on delete
    if (po.status === 'Received') {
      for (const item of po.items) {
        if (item.product) {
          const product = await Product.findById(item.product);
          if (product) {
            product.stock = Math.max(0, product.stock - item.quantity);
            await product.save();
          }
        }
      }
    }

    const poNumber = po.poNumber;
    await po.deleteOne();

    await logActivity(req, `Deleted Purchase Order: ${poNumber}`, 'PurchaseOrders', `Removed PO and reverted stock if applicable`);

    res.json({ message: 'Purchase order deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
