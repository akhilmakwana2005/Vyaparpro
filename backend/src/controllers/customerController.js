import Customer from '../models/Customer.js';
import Notification from '../models/Notification.js';
import { logActivity } from '../utils/logger.js';
import { sendSMS } from '../utils/smsSender.js';

// @desc    Get all customers for a user
// @route   GET /api/customers
// @access  Private
export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ user: req.businessOwnerId }).sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (customer && customer.user.toString() === req.businessOwnerId.toString()) {
      res.json(customer);
    } else {
      res.status(404).json({ message: 'Customer not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a customer
// @route   POST /api/customers
// @access  Private
export const createCustomer = async (req, res) => {
  try {
    const { name, mobile, email, gstNumber, openingBalance, address, notes, image } = req.body;

    const customer = new Customer({
      user: req.businessOwnerId,
      name,
      mobile,
      email,
      gstNumber,
      openingBalance,
      address,
      notes,
      image,
    });

    const createdCustomer = await customer.save();

    // Create a notification
    await Notification.create({
      user: req.businessOwnerId,
      title: 'New Customer Added',
      message: `${name} has been registered as a new customer.`,
      type: 'customer'
    });

    await logActivity(req, `Added Customer: ${createdCustomer.name}`, 'Customers', `Mobile: ${createdCustomer.mobile}`);

    res.status(201).json(createdCustomer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private
export const updateCustomer = async (req, res) => {
  try {
    const { name, mobile, email, gstNumber, openingBalance, address, notes, image } = req.body;
    const customer = await Customer.findById(req.params.id);

    if (customer && customer.user.toString() === req.businessOwnerId.toString()) {
      customer.name = name || customer.name;
      customer.mobile = mobile || customer.mobile;
      customer.email = email !== undefined ? email : customer.email;
      customer.gstNumber = gstNumber !== undefined ? gstNumber : customer.gstNumber;
      customer.openingBalance = openingBalance !== undefined ? openingBalance : customer.openingBalance;
      customer.address = address !== undefined ? address : customer.address;
      customer.notes = notes !== undefined ? notes : customer.notes;
      customer.image = image !== undefined ? image : customer.image;

      const updatedCustomer = await customer.save();

      await logActivity(req, `Updated Customer: ${updatedCustomer.name}`, 'Customers', `Updated details for customer`);

      res.json(updatedCustomer);
    } else {
      res.status(404).json({ message: 'Customer not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Private
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (customer && customer.user.toString() === req.businessOwnerId.toString()) {
      const customerName = customer.name;
      await customer.deleteOne();

      await logActivity(req, `Deleted Customer: ${customerName}`, 'Customers', `Removed customer record`);

      res.json({ message: 'Customer removed' });
    } else {
      res.status(404).json({ message: 'Customer not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send payment reminder SMS to customer
// @route   POST /api/customers/:id/remind
// @access  Private
export const sendReminderSMS = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (customer && customer.user.toString() === req.businessOwnerId.toString()) {
      if (!customer.mobile) {
        return res.status(400).json({ message: 'Customer has no mobile number recorded' });
      }

      // Normally we would calculate exact pending dues from Invoices, 
      // but for this example we will remind them of their opening balance or general dues.
      const pendingAmount = customer.openingBalance || 0;
      
      const message = `Dear ${customer.name}, this is a gentle reminder from VyaparPro that an amount of Rs. ${pendingAmount} is pending. Kindly arrange payment. Thank you!`;

      const smsResult = await sendSMS(customer.mobile, message, req);
      
      if (smsResult.success) {
        res.json({ message: 'Reminder SMS sent successfully!', simulated: smsResult.simulated });
      } else {
        res.status(500).json({ message: 'Failed to send SMS', error: smsResult.error });
      }
    } else {
      res.status(404).json({ message: 'Customer not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
