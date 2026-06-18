import Quotation from '../models/Quotation.js';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';

// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Private
export const getQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('customer');
    res.json(quotations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single quotation
// @route   GET /api/quotations/:id
// @access  Private
export const getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, user: req.user._id }).populate('customer');
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new quotation
// @route   POST /api/quotations
// @access  Private
export const createQuotation = async (req, res) => {
  try {
    const { customerName, customer, items, subtotal, gstAmount, discount, total, notes, validUntil } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in quotation' });
    }

    // Generate quotation number
    const count = await Quotation.countDocuments({ user: req.user._id });
    const quotationNumber = `EST-${1000 + count + 1}`;

    // Note: We DO NOT deduct stock for a quotation

    const quotation = new Quotation({
      user: req.user._id,
      quotationNumber,
      customerName,
      customer: customer || null,
      items,
      subtotal,
      gstAmount,
      discount,
      total,
      notes,
      validUntil: validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
      status: 'Draft',
    });

    const createdQuotation = await quotation.save();
    res.status(201).json(createdQuotation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update quotation
// @route   PUT /api/quotations/:id
// @access  Private
export const updateQuotation = async (req, res) => {
  try {
    const { status, notes, validUntil } = req.body;
    const quotation = await Quotation.findOne({ _id: req.params.id, user: req.user._id });

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    if (status) quotation.status = status;
    if (notes !== undefined) quotation.notes = notes;
    if (validUntil) quotation.validUntil = validUntil;

    const updatedQuotation = await quotation.save();
    res.json(updatedQuotation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete quotation
// @route   DELETE /api/quotations/:id
// @access  Private
export const deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, user: req.user._id });

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    await quotation.deleteOne();
    res.json({ message: 'Quotation removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Convert quotation to invoice
// @route   POST /api/quotations/:id/convert
// @access  Private
export const convertQuotationToInvoice = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, user: req.user._id });

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    if (quotation.status === 'Converted') {
      return res.status(400).json({ message: 'Quotation already converted' });
    }

    // Check stock availability
    for (const item of quotation.items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ message: `Product ${item.name} not found` });
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${item.name}` });
      }
    }

    // Deduct stock
    for (const item of quotation.items) {
      const product = await Product.findById(item.product);
      product.stock -= item.quantity;
      await product.save();
    }

    // Generate Invoice number
    const count = await Invoice.countDocuments({ user: req.user._id });
    const invoiceNumber = `INV-${1000 + count + 1}`;

    // Create Invoice
    const invoice = new Invoice({
      user: req.user._id,
      invoiceNumber,
      customerName: quotation.customerName,
      customer: quotation.customer,
      items: quotation.items,
      subtotal: quotation.subtotal,
      gstAmount: quotation.gstAmount,
      discount: quotation.discount,
      total: quotation.total,
      status: 'Paid', // Assuming converted quotations become paid invoices immediately
    });

    const createdInvoice = await invoice.save();

    // Update quotation status
    quotation.status = 'Converted';
    await quotation.save();

    res.status(201).json({ quotation, invoice: createdInvoice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
