import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product.js';
import User from './src/models/User.js';

dotenv.config();

const productsToSeed = [
  {
    name: 'OnePlus Nord CE 4',
    category: 'Mobile',
    sku: 'OP-NORD-CE4',
    sellingPrice: 24999,
    purchasePrice: 21500,
    stock: 15,
    minStockAlert: 3,
    gstRate: '18%',
    hsnCode: '8517',
    description: 'OnePlus Nord CE 4 (Celadon Marble, 8GB RAM, 128GB Storage)',
    image: 'https://via.placeholder.com/400x400.png?text=OnePlus+Nord+CE4'
  },
  {
    name: 'BoAt Airdopes 141',
    category: 'Earbuds',
    sku: 'BOAT-AD-141',
    sellingPrice: 1299,
    purchasePrice: 850,
    stock: 50,
    minStockAlert: 10,
    gstRate: '18%',
    hsnCode: '8518',
    description: 'boAt Airdopes 141 Bluetooth Truly Wireless Earbuds with 42H Playback',
    image: 'https://via.placeholder.com/400x400.png?text=BoAt+Airdopes+141'
  },
  {
    name: 'Mi Power Bank 3i',
    category: 'Power Bank',
    sku: 'MI-PB-3I',
    sellingPrice: 1999,
    purchasePrice: 1400,
    stock: 30,
    minStockAlert: 5,
    gstRate: '18%',
    hsnCode: '8504',
    description: 'Mi 20000mAh 3i Lithium Polymer Power Bank with 18W Fast Charging',
    image: 'https://via.placeholder.com/400x400.png?text=Mi+Power+Bank+3i'
  },
  {
    name: 'JBL Go 3',
    category: 'Speaker',
    sku: 'JBL-GO-3',
    sellingPrice: 2999,
    purchasePrice: 2200,
    stock: 25,
    minStockAlert: 4,
    gstRate: '18%',
    hsnCode: '8518',
    description: 'JBL Go 3 Wireless Ultra-Portable Bluetooth Speaker',
    image: 'https://via.placeholder.com/400x400.png?text=JBL+Go+3'
  },
  {
    name: 'Sony Bravia 43 inch 4K',
    category: 'Television',
    sku: 'SONY-43-4K',
    sellingPrice: 39999,
    purchasePrice: 34000,
    stock: 8,
    minStockAlert: 2,
    gstRate: '28%',
    hsnCode: '8528',
    description: 'Sony Bravia 108 cm (43 inches) 4K Ultra HD Smart LED Google TV',
    image: 'https://via.placeholder.com/400x400.png?text=Sony+Bravia+43'
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    category: 'Mobile',
    sku: 'SAM-S24U',
    sellingPrice: 129999,
    purchasePrice: 112000,
    stock: 5,
    minStockAlert: 1,
    gstRate: '18%',
    hsnCode: '8517',
    description: 'Samsung Galaxy S24 Ultra 5G (Titanium Gray, 12GB RAM, 256GB Storage)',
    image: 'https://via.placeholder.com/400x400.png?text=Samsung+Galaxy+S24'
  },
  {
    name: 'Dell Inspiron 15',
    category: 'Laptop',
    sku: 'DELL-INS-15',
    sellingPrice: 48999,
    purchasePrice: 41500,
    stock: 10,
    minStockAlert: 2,
    gstRate: '18%',
    hsnCode: '8471',
    description: 'Dell Inspiron 15 Thin & Light Laptop, Core i3-1215U, 8GB RAM, 512GB SSD',
    image: 'https://via.placeholder.com/400x400.png?text=Dell+Inspiron+15'
  },
  {
    name: 'Canon EOS 1500D',
    category: 'Camera',
    sku: 'CANON-1500D',
    sellingPrice: 41999,
    purchasePrice: 36000,
    stock: 6,
    minStockAlert: 2,
    gstRate: '18%',
    hsnCode: '8525',
    description: 'Canon EOS 1500D 24.1MP Digital SLR Camera with EF-S 18-55mm IS II Lens',
    image: 'https://via.placeholder.com/400x400.png?text=Canon+EOS+1500D'
  },
  {
    name: 'Apple Watch SE',
    category: 'Other',
    sku: 'APPLE-W-SE',
    sellingPrice: 29900,
    purchasePrice: 25000,
    stock: 12,
    minStockAlert: 3,
    gstRate: '18%',
    hsnCode: '9102',
    description: 'Apple Watch SE (2nd Gen) [GPS 44mm] Smartwatch with Midnight Aluminium Case',
    image: 'https://via.placeholder.com/400x400.png?text=Apple+Watch+SE'
  },
  {
    name: 'SanDisk Ultra Dual 64GB',
    category: 'Accessories',
    sku: 'SD-D-64GB',
    sellingPrice: 699,
    purchasePrice: 450,
    stock: 100,
    minStockAlert: 15,
    gstRate: '18%',
    hsnCode: '8523',
    description: 'SanDisk Ultra Dual 64GB USB 3.1 Flash Drive Type-C',
    image: 'https://via.placeholder.com/400x400.png?text=SanDisk+Ultra+Dual'
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    const users = await User.find({});
    if (users.length === 0) {
      console.log('No users found in database to seed products for.');
      process.exit(0);
    }

    console.log(`Found ${users.length} users. Seeding products...`);

    for (const user of users) {
      // Clear existing products for this user to avoid duplicates if re-run
      await Product.deleteMany({ user: user._id });

      const productsWithUser = productsToSeed.map(p => ({
        ...p,
        user: user._id
      }));

      await Product.insertMany(productsWithUser);
      console.log(`Seeded 10 products successfully for user: ${user.email}`);
    }

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  }
}

seed();
