import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Notification from '../models/Notification.js';
import { logActivity } from '../utils/logger.js';

// @desc    Get all invoices for a user
// @route   GET /api/invoices
// @access  Private
export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.businessOwnerId }).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (invoice && invoice.user.toString() === req.businessOwnerId.toString()) {
      res.json(invoice);
    } else {
      res.status(404).json({ message: 'Invoice not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new invoice and deduct stock
// @route   POST /api/invoices
// @access  Private
export const createInvoice = async (req, res) => {
  try {
    const {
      invoiceNumber,
      customerName,
      customer, // optional ID
      items,
      subtotal,
      gstAmount,
      discount,
      total,
      status,
    } = req.body;

    if (items && items.length === 0) {
      return res.status(400).json({ message: 'No invoice items' });
    }

    const invoice = new Invoice({
      user: req.businessOwnerId,
      invoiceNumber,
      customerName,
      customer,
      items,
      subtotal,
      gstAmount,
      discount,
      total,
      status,
      rewardPointsEarned: req.body.rewardPointsEarned || 0,
      rewardPointsRedeemed: req.body.rewardPointsRedeemed || 0,
    });

    const createdInvoice = await invoice.save();

    // Deduct stock for each item if the invoice is generated successfully
    for (const item of items) {
      if (item.product) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock = product.stock - item.quantity;
          await product.save();
          
          if (product.stock <= (product.minStockAlert || 5)) {
            // Generate low stock notification
            await Notification.create({
              user: req.businessOwnerId,
              title: 'Low Stock Alert',
              message: `Stock for ${product.name} is running low (${product.stock} remaining).`,
              type: 'stock'
            });
          }
        }
      }
    }

    // Update customer reward points if applicable
    if (customer && status === 'Paid') {
      const customerDoc = await Customer.findById(customer);
      if (customerDoc) {
        // Deduct redeemed points
        const pointsRedeemed = req.body.rewardPointsRedeemed || 0;
        // Calculate new points to earn (e.g., 1 point per 100 Rs spent, but let frontend pass it or we calculate here)
        // We will use the points passed from frontend `rewardPointsEarned`
        const pointsEarned = req.body.rewardPointsEarned || 0;
        
        customerDoc.rewardPoints = (customerDoc.rewardPoints || 0) - pointsRedeemed + pointsEarned;
        await customerDoc.save();
      }
    }

    await logActivity(req, `Created Invoice ${createdInvoice.invoiceNumber}`, 'Billing', `Customer: ${customerName}, Total: ₹${total}`);

    res.status(201).json(createdInvoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update invoice status
// @route   PUT /api/invoices/:id
// @access  Private
export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (invoice && invoice.user.toString() === req.businessOwnerId.toString()) {
      invoice.status = req.body.status || invoice.status;
      const updatedInvoice = await invoice.save();

      await logActivity(req, `Updated Invoice ${updatedInvoice.invoiceNumber} status`, 'Billing', `New status: ${updatedInvoice.status}`);

      res.json(updatedInvoice);
    } else {
      res.status(404).json({ message: 'Invoice not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an invoice
// @route   DELETE /api/invoices/:id
// @access  Private
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (invoice && invoice.user.toString() === req.businessOwnerId.toString()) {
      // Optional: Add stock back when invoice is deleted
      for (const item of invoice.items) {
        if (item.product) {
          const product = await Product.findById(item.product);
          if (product) {
            product.stock = product.stock + item.quantity;
            await product.save();
          }
        }
      }

      const invNum = invoice.invoiceNumber;
      await invoice.deleteOne();

      await logActivity(req, `Deleted Invoice ${invNum}`, 'Billing', `Invoice deleted and stock restored`);

      res.json({ message: 'Invoice removed and stock restored' });
    } else {
      res.status(404).json({ message: 'Invoice not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
