import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';
import Expense from '../models/Expense.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Quotation from '../models/Quotation.js';
import User from '../models/User.js';

// @desc    Export database
// @route   GET /api/backup/export
// @access  Private
export const exportData = async (req, res) => {
  try {
    // Only owner can export
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Only owner can export data' });
    }

    const ownerId = req.user._id;

    // Fetch all collections
    const [products, customers, invoices, expenses, purchaseOrders, quotations, staff] = await Promise.all([
      Product.find({ user: ownerId }),
      Customer.find({ user: ownerId }),
      Invoice.find({ user: ownerId }),
      Expense.find({ user: ownerId }),
      PurchaseOrder.find({ user: ownerId }),
      Quotation.find({ user: ownerId }),
      User.find({ ownerId: ownerId })
    ]);

    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      ownerId,
      data: {
        products,
        customers,
        invoices,
        expenses,
        purchaseOrders,
        quotations,
        staff
      }
    };

    res.json(backupData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to export data: ' + error.message });
  }
};

// @desc    Import database
// @route   POST /api/backup/import
// @access  Private
export const importData = async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Only owner can import data' });
    }

    const backup = req.body;
    if (!backup || !backup.data || backup.version !== '1.0') {
      return res.status(400).json({ message: 'Invalid backup file format' });
    }

    const ownerId = req.user._id;
    const { products, customers, invoices, expenses, purchaseOrders, quotations, staff } = backup.data;

    // Optional: We could validate data lengths here.

    // Wipe existing data for this owner
    await Promise.all([
      Product.deleteMany({ user: ownerId }),
      Customer.deleteMany({ user: ownerId }),
      Invoice.deleteMany({ user: ownerId }),
      Expense.deleteMany({ user: ownerId }),
      PurchaseOrder.deleteMany({ user: ownerId }),
      Quotation.deleteMany({ user: ownerId }),
      User.deleteMany({ ownerId: ownerId })
    ]);

    // Insert imported data
    // We want to keep the original _ids to maintain relationships (like Invoice -> Product).
    // The backup JSON should have them.
    if (products && products.length) await Product.insertMany(products);
    if (customers && customers.length) await Customer.insertMany(customers);
    if (invoices && invoices.length) await Invoice.insertMany(invoices);
    if (expenses && expenses.length) await Expense.insertMany(expenses);
    if (purchaseOrders && purchaseOrders.length) await PurchaseOrder.insertMany(purchaseOrders);
    if (quotations && quotations.length) await Quotation.insertMany(quotations);
    if (staff && staff.length) await User.insertMany(staff);

    res.json({ message: 'Data imported successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to import data: ' + error.message });
  }
};
