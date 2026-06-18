import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Product from './models/Product.js';
import Customer from './models/Customer.js';
import Supplier from './models/Supplier.js';
import Invoice from './models/Invoice.js';
import PurchaseOrder from './models/PurchaseOrder.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    const testEmail = 'testshop@vyapar.com';

    // 1. Delete old test user & data
    const existingUser = await User.findOne({ email: testEmail });
    if (existingUser) {
      console.log('Deleting existing test user data...');
      await Product.deleteMany({ user: existingUser._id });
      await Customer.deleteMany({ user: existingUser._id });
      await Supplier.deleteMany({ user: existingUser._id });
      await Invoice.deleteMany({ user: existingUser._id });
      await PurchaseOrder.deleteMany({ user: existingUser._id });
      await User.deleteOne({ _id: existingUser._id });
    }

    console.log('Creating new test user...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    const user = await User.create({
      name: 'Test Shop Owner',
      email: testEmail,
      password: hashedPassword,
      mobile: '9999999999',
      role: 'owner',
      businessName: 'Vyapar E2E Test Shop',
      businessAddress: '123 Test Ave, Demo City'
    });

    console.log('User created:', user._id);

    // 2. Create Products
    console.log('Creating 10 products...');
    const productsData = [];
    for (let i = 1; i <= 10; i++) {
      productsData.push({
        user: user._id,
        name: `Test Product ${i}`,
        sku: `TEST-SKU-${1000 + i}`,
        category: i % 2 === 0 ? 'Electronics' : 'Accessories',
        sellingPrice: 500 + i * 100,
        purchasePrice: 300 + i * 80,
        stock: 50 + i * 5,
        minStockAlert: 10,
        gstRate: '18%',
        description: `This is test product ${i}`
      });
    }
    const createdProducts = await Product.insertMany(productsData);

    // 3. Create Customers
    console.log('Creating 10 customers...');
    const customersData = [];
    for (let i = 1; i <= 10; i++) {
      customersData.push({
        user: user._id,
        name: `Test Customer ${i}`,
        mobile: `98000000${i.toString().padStart(2, '0')}`,
        email: `customer${i}@test.com`,
        openingBalance: i % 3 === 0 ? i * 500 : 0,
        address: `Customer Address ${i}`
      });
    }
    const createdCustomers = await Customer.insertMany(customersData);

    // 4. Create Suppliers
    console.log('Creating 5 suppliers...');
    const suppliersData = [];
    for (let i = 1; i <= 5; i++) {
      suppliersData.push({
        user: user._id,
        name: `Test Supplier ${i}`,
        contactPerson: `Supplier Contact ${i}`,
        mobile: `97000000${i.toString().padStart(2, '0')}`,
        openingBalance: i % 2 === 0 ? i * 1000 : 0,
        address: `Supplier Address ${i}`
      });
    }
    const createdSuppliers = await Supplier.insertMany(suppliersData);

    // 5. Create Purchase Orders
    console.log('Creating 5 purchase orders...');
    const posData = [];
    for (let i = 1; i <= 5; i++) {
      const supplier = createdSuppliers[i - 1];
      const product = createdProducts[i];
      const qty = i * 2;
      const total = qty * product.purchasePrice;

      posData.push({
        user: user._id,
        poNumber: `PO-TEST-${Date.now().toString().slice(-4)}-${i}`,
        supplierName: supplier.name,
        supplierContact: supplier.mobile,
        items: [{
          product: product._id,
          name: product.name,
          quantity: qty,
          purchasePrice: product.purchasePrice
        }],
        totalAmount: total,
        status: i % 2 === 0 ? 'Received' : 'Pending',
        expectedDate: new Date(Date.now() + 86400000 * i)
      });
    }
    await PurchaseOrder.insertMany(posData);

    // 6. Create Invoices
    console.log('Creating 5 invoices...');
    const invoicesData = [];
    for (let i = 1; i <= 5; i++) {
      const customer = createdCustomers[i];
      const product1 = createdProducts[i];
      const product2 = createdProducts[i + 1];
      
      const qty1 = 2;
      const qty2 = 1;
      const total1 = qty1 * product1.sellingPrice;
      const total2 = qty2 * product2.sellingPrice;
      const subTotal = total1 + total2;

      invoicesData.push({
        user: user._id,
        invoiceNumber: `INV-TEST-${Date.now().toString().slice(-4)}-${i}`,
        customer: customer._id,
        customerName: customer.name,
        customerContact: customer.mobile,
        items: [
          { product: product1._id, name: product1.name, quantity: qty1, price: product1.sellingPrice, total: total1 },
          { product: product2._id, name: product2.name, quantity: qty2, price: product2.sellingPrice, total: total2 }
        ],
        subTotal,
        gstAmount: subTotal * 0.18,
        discount: 0,
        total: subTotal * 1.18,
        amountPaid: i % 2 !== 0 ? subTotal * 1.18 : 0,
        paymentMethod: 'Cash',
        status: i % 2 !== 0 ? 'Paid' : 'Pending',
      });
    }
    await Invoice.insertMany(invoicesData);

    console.log('✅ Seeding completed successfully!');
    console.log('-----------------------------------');
    console.log('Login Details:');
    console.log('Email: testshop@vyapar.com');
    console.log('Password: 123456');
    console.log('-----------------------------------');
    
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding data: ${error.message}`);
    process.exit(1);
  }
};

seedData();
