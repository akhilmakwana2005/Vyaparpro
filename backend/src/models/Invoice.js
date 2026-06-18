import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    invoiceNumber: {
      type: String,
      required: true,
    },
    customerName: {
      type: String, // String for walk-in customers or actual customer name
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId, // Optional reference if it's a registered customer
      ref: 'Customer',
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        name: { type: String, required: true },
        sku: { type: String },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      default: 0.0,
    },
    gstAmount: {
      type: Number,
      required: true,
      default: 0.0,
    },
    discount: {
      type: Number,
      required: true,
      default: 0.0,
    },
    total: {
      type: Number,
      required: true,
      default: 0.0,
    },
    rewardPointsEarned: {
      type: Number,
      default: 0,
    },
    rewardPointsRedeemed: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ['Paid', 'Pending', 'Hold', 'Returned', 'Partial Return'],
      default: 'Paid',
    },
    returnedItems: [
      {
        itemName: { type: String, required: true },
        quantity: { type: Number, required: true },
        refundAmount: { type: Number, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
