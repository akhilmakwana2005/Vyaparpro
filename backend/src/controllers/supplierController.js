import Supplier from '../models/Supplier.js';
import { logActivity } from '../utils/logger.js';

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ user: req.businessOwnerId }).sort({ createdAt: -1 });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get suppliers' });
  }
};

// @desc    Get supplier by ID
// @route   GET /api/suppliers/:id
// @access  Private
export const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (supplier && supplier.user.toString() === req.businessOwnerId.toString()) {
      res.json(supplier);
    } else {
      res.status(404).json({ message: 'Supplier not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to get supplier' });
  }
};

// @desc    Create new supplier
// @route   POST /api/suppliers
// @access  Private
export const createSupplier = async (req, res) => {
  try {
    const { name, contactPerson, mobile, email, gstNumber, openingBalance, address, notes } = req.body;

    const supplier = new Supplier({
      user: req.businessOwnerId,
      name,
      contactPerson,
      mobile,
      email,
      gstNumber,
      openingBalance,
      address,
      notes,
    });

    const createdSupplier = await supplier.save();

    await logActivity(req, `Added Supplier: ${createdSupplier.name}`, 'Suppliers', `Contact: ${createdSupplier.mobile}`);

    res.status(201).json(createdSupplier);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create supplier' });
  }
};

// @desc    Update a supplier
// @route   PUT /api/suppliers/:id
// @access  Private
export const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (supplier && supplier.user.toString() === req.businessOwnerId.toString()) {
      supplier.name = req.body.name || supplier.name;
      supplier.contactPerson = req.body.contactPerson !== undefined ? req.body.contactPerson : supplier.contactPerson;
      supplier.mobile = req.body.mobile || supplier.mobile;
      supplier.email = req.body.email !== undefined ? req.body.email : supplier.email;
      supplier.gstNumber = req.body.gstNumber !== undefined ? req.body.gstNumber : supplier.gstNumber;
      supplier.openingBalance = req.body.openingBalance !== undefined ? req.body.openingBalance : supplier.openingBalance;
      supplier.address = req.body.address !== undefined ? req.body.address : supplier.address;
      supplier.notes = req.body.notes !== undefined ? req.body.notes : supplier.notes;

      const updatedSupplier = await supplier.save();

      await logActivity(req, `Updated Supplier: ${updatedSupplier.name}`, 'Suppliers', `Updated supplier details`);

      res.json(updatedSupplier);
    } else {
      res.status(404).json({ message: 'Supplier not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Failed to update supplier' });
  }
};

// @desc    Delete a supplier
// @route   DELETE /api/suppliers/:id
// @access  Private
export const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (supplier && supplier.user.toString() === req.businessOwnerId.toString()) {
      const supplierName = supplier.name;
      await supplier.deleteOne();

      await logActivity(req, `Deleted Supplier: ${supplierName}`, 'Suppliers', `Removed supplier record`);

      res.json({ message: 'Supplier removed' });
    } else {
      res.status(404).json({ message: 'Supplier not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete supplier' });
  }
};
