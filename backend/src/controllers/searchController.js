import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import Invoice from '../models/Invoice.js';
import Quotation from '../models/Quotation.js';

export const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(200).json({
        products: [],
        customers: [],
        suppliers: [],
        invoices: [],
        quotations: []
      });
    }

    const searchQuery = { $regex: q, $options: 'i' };
    const userQuery = { user: req.user._id };

    // Run searches concurrently
    const [products, customers, suppliers, invoices, quotations] = await Promise.all([
      Product.find({ ...userQuery, $or: [{ name: searchQuery }, { sku: searchQuery }, { category: searchQuery }] })
        .limit(5)
        .select('_id name sku sellingPrice category image stock'),
        
      Customer.find({ ...userQuery, $or: [{ name: searchQuery }, { mobile: searchQuery }, { email: searchQuery }] })
        .limit(5)
        .select('_id name mobile email openingBalance'),

      Supplier.find({ ...userQuery, $or: [{ name: searchQuery }, { mobile: searchQuery }, { contactPerson: searchQuery }] })
        .limit(5)
        .select('_id name mobile contactPerson openingBalance'),

      Invoice.find({ ...userQuery, $or: [{ invoiceNumber: searchQuery }, { customerName: searchQuery }] })
        .limit(5)
        .select('_id invoiceNumber customerName total status createdAt'),
        
      Quotation.find({ ...userQuery, $or: [{ quotationNumber: searchQuery }, { customerName: searchQuery }] })
        .limit(5)
        .select('_id quotationNumber customerName total status createdAt'),
    ]);

    res.status(200).json({
      products,
      customers,
      suppliers,
      invoices,
      quotations
    });

  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({ message: 'Error performing search', error: error.message });
  }
};
