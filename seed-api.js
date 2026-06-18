import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';
let token = '';

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${token}`
  }
});

const runSeed = async () => {
  try {
    console.log('--- VyaparPro E2E Test Seeding via API ---');
    const email = `testshop${Date.now()}@vyapar.com`;

    // 1. Register User
    console.log('Registering new user:', email);
    const userRes = await axios.post(`${API_BASE}/users/register`, {
      name: 'Test Shop Owner',
      email: email,
      password: 'password123',
      mobile: '9999999999',
      businessName: 'Vyapar E2E Shop',
      businessAddress: 'Testing Ave'
    });
    
    token = userRes.data.token;
    console.log('User registered. Token acquired.');

    // 2. Add Products
    console.log('Adding 5 Products...');
    const products = [];
    for (let i = 1; i <= 5; i++) {
      const p = await axios.post(`${API_BASE}/products`, {
        name: `E2E Product ${i}`,
        sku: `SKU-${1000 + i}`,
        category: 'Electronics',
        sellingPrice: 1000 + (i * 100),
        purchasePrice: 800 + (i * 50),
        stock: 50,
        minStockAlert: 10,
        gstRate: '18%'
      }, authConfig());
      products.push(p.data);
    }

    // 3. Add Customers
    console.log('Adding 5 Customers...');
    const customers = [];
    for (let i = 1; i <= 5; i++) {
      const c = await axios.post(`${API_BASE}/customers`, {
        name: `E2E Customer ${i}`,
        mobile: `980000000${i}`,
        email: `cust${i}@test.com`,
        openingBalance: i * 500,
        address: `Address ${i}`
      }, authConfig());
      customers.push(c.data);
    }

    // 4. Add Suppliers
    console.log('Adding 3 Suppliers...');
    const suppliers = [];
    for (let i = 1; i <= 3; i++) {
      const s = await axios.post(`${API_BASE}/suppliers`, {
        name: `E2E Supplier ${i}`,
        contactPerson: `Contact ${i}`,
        mobile: `970000000${i}`,
        openingBalance: i * 1000
      }, authConfig());
      suppliers.push(s.data);
    }

    // 5. Add Purchase Orders
    console.log('Adding 2 Purchase Orders...');
    for (let i = 1; i <= 2; i++) {
      await axios.post(`${API_BASE}/purchase-orders`, {
        poNumber: `PO-${Date.now()}-${i}`,
        supplierName: suppliers[i].name,
        supplierContact: suppliers[i].mobile,
        items: [{
          product: products[i]._id,
          name: products[i].name,
          quantity: 10,
          purchasePrice: products[i].purchasePrice
        }],
        totalAmount: 10 * products[i].purchasePrice,
        status: 'Pending',
        expectedDate: new Date().toISOString()
      }, authConfig());
    }

    // 6. Add Invoices
    console.log('Adding 2 Invoices...');
    for (let i = 0; i < 2; i++) {
      const subTotal = products[i].sellingPrice * 2;
      await axios.post(`${API_BASE}/billing`, {
        invoiceNumber: `INV-${Date.now()}-${i}`,
        customer: customers[i]._id,
        customerName: customers[i].name,
        customerContact: customers[i].mobile,
        items: [{
          product: products[i]._id,
          name: products[i].name,
          quantity: 2,
          price: products[i].sellingPrice,
          total: subTotal
        }],
        subTotal,
        gstAmount: subTotal * 0.18,
        discount: 0,
        total: subTotal * 1.18,
        amountPaid: subTotal * 1.18,
        paymentMethod: 'UPI',
        status: 'Paid'
      }, authConfig());
    }

    console.log('✅ API Seeding Completed!');
    console.log(`Login Email: ${email}`);
    console.log(`Login Password: password123`);

  } catch (error) {
    console.error('Error seeding via API:', error.response?.data || error.message);
  }
};

runSeed();
