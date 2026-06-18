import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import { logActivity } from '../utils/logger.js';

// @desc    Process a return on a paid invoice
// @route   POST /api/invoices/:id/return
// @access  Private
export const processReturn = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice || invoice.user.toString() !== req.businessOwnerId.toString()) {
      return res.status(404).json({ message: 'Invoice not found or unauthorized' });
    }

    if (invoice.status === 'Pending' || invoice.status === 'Hold') {
      return res.status(400).json({ message: 'Only paid invoices can be returned' });
    }

    const { items: returnItems } = req.body; // [{ name, productId, quantity }]

    if (!returnItems || returnItems.length === 0) {
      return res.status(400).json({ message: 'No items specified for return' });
    }

    let refundTotal = 0;
    const processedReturns = [];

    for (const returnItem of returnItems) {
      // Find matching item in invoice
      const invoiceItem = invoice.items.find(
        (i) => i.name === returnItem.name || (returnItem.productId && i.product?.toString() === returnItem.productId)
      );

      if (!invoiceItem) {
        return res.status(400).json({ message: `Item "${returnItem.name}" not found in invoice` });
      }

      // Check already returned quantity
      const alreadyReturned = (invoice.returnedItems || [])
        .filter((r) => r.itemName === returnItem.name)
        .reduce((sum, r) => sum + r.quantity, 0);

      const availableToReturn = invoiceItem.quantity - alreadyReturned;

      if (returnItem.quantity > availableToReturn) {
        return res.status(400).json({
          message: `Cannot return ${returnItem.quantity} of "${returnItem.name}". Only ${availableToReturn} available.`,
        });
      }

      const itemRefund = returnItem.quantity * invoiceItem.price;
      refundTotal += itemRefund;

      processedReturns.push({
        itemName: returnItem.name,
        quantity: returnItem.quantity,
        refundAmount: itemRefund,
      });

      // Restore stock
      if (invoiceItem.product) {
        const product = await Product.findById(invoiceItem.product);
        if (product) {
          product.stock = product.stock + returnItem.quantity;
          await product.save();
        }
      }
    }

    // Append to returnedItems
    invoice.returnedItems = [...(invoice.returnedItems || []), ...processedReturns];

    // Determine new status
    const totalQtyOrdered = invoice.items.reduce((s, i) => s + i.quantity, 0);
    const totalQtyReturned = invoice.returnedItems.reduce((s, r) => s + r.quantity, 0);

    if (totalQtyReturned >= totalQtyOrdered) {
      invoice.status = 'Returned';
    } else {
      invoice.status = 'Partial Return';
    }

    const updated = await invoice.save();
    
    // Log the return activity (Credit Note)
    await logActivity(req, `Processed Return for Invoice ${invoice.invoiceNumber}`, 'Billing', `Refund/Credit Note Amount: ₹${refundTotal}`);

    res.json({ invoice: updated, refundTotal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
