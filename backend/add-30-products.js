import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vyaparpro';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  description: { type: String },
  sellingPrice: { type: Number, required: true },
  purchasePrice: { type: Number, required: true },
  stock: { type: Number, required: true },
  minStockAlert: { type: Number, required: true },
  unit: { type: String, default: 'pcs' },
  gstRate: { type: String, default: '18%' },
  image: { type: String },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}));

const runAddProducts = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    
    console.log('Connected. Finding all owners...');
    const owners = await User.find({ role: 'owner' });
    if (owners.length === 0) {
      console.log('No owners found in DB.');
      process.exit(1);
    }

    console.log(`Found ${owners.length} owners. Adding 30 products for each...`);
    
    let totalAdded = 0;
    for (const owner of owners) {
      const products = [];
      for (let i = 1; i <= 30; i++) {
        products.push({
          name: `Bulk Item ${i} (${Date.now().toString().slice(-4)})`,
          sku: `BULK-${owner._id.toString().slice(-4)}-${Date.now()}-${i}`,
          category: 'Bulk Testing',
          sellingPrice: 150 + i,
          purchasePrice: 100 + i,
          stock: 50,
          minStockAlert: 5,
          gstRate: '18%',
          ownerId: owner._id
        });
      }
      await Product.insertMany(products);
      totalAdded += 30;
    }

    console.log(`✅ Successfully added ${totalAdded} products to DB!`);

    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
};

runAddProducts();
