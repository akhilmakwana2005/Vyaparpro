import Product from '../models/Product.js';
import { logActivity } from '../utils/logger.js';

// @desc    Get all products for a user
// @route   GET /api/products
// @access  Private
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ user: req.businessOwnerId }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product && product.user.toString() === req.businessOwnerId.toString()) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private
export const createProduct = async (req, res) => {
  try {
    const { name, category, sku, sellingPrice, purchasePrice, stock, minStockAlert, gstRate, hsnCode, description, image } = req.body;

    const product = new Product({
      user: req.businessOwnerId,
      name,
      category,
      sku,
      sellingPrice,
      purchasePrice,
      stock,
      minStockAlert,
      gstRate,
      hsnCode,
      description,
      image,
    });

    const createdProduct = await product.save();

    await logActivity(req, `Created product: ${createdProduct.name}`, 'Products', `SKU: ${createdProduct.sku || 'N/A'}`);

    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private
export const updateProduct = async (req, res) => {
  try {
    const { name, category, sku, sellingPrice, purchasePrice, stock, minStockAlert, gstRate, hsnCode, description, image } = req.body;
    const product = await Product.findById(req.params.id);

    if (product && product.user.toString() === req.businessOwnerId.toString()) {
      product.name = name || product.name;
      product.category = category || product.category;
      product.sku = sku !== undefined ? sku : product.sku;
      product.sellingPrice = sellingPrice !== undefined ? sellingPrice : product.sellingPrice;
      product.purchasePrice = purchasePrice !== undefined ? purchasePrice : product.purchasePrice;
      product.stock = stock !== undefined ? stock : product.stock;
      product.minStockAlert = minStockAlert !== undefined ? minStockAlert : product.minStockAlert;
      product.gstRate = gstRate !== undefined ? gstRate : product.gstRate;
      product.hsnCode = hsnCode !== undefined ? hsnCode : product.hsnCode;
      product.description = description !== undefined ? description : product.description;
      product.image = image !== undefined ? image : product.image;

      const updatedProduct = await product.save();

      await logActivity(req, `Updated product: ${updatedProduct.name}`, 'Products', `Updated details for SKU: ${updatedProduct.sku || 'N/A'}`);

      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product && product.user.toString() === req.businessOwnerId.toString()) {
      const productName = product.name;
      await product.deleteOne();

      await logActivity(req, `Deleted product: ${productName}`, 'Products', `Deleted product from inventory`);

      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
