import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'staff', 'user'],
      default: 'owner',
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    taxSettings: {
      cgst: { type: Number, default: 9 },
      sgst: { type: Number, default: 9 },
      igst: { type: Number, default: 18 },
      showGstOnBills: { type: Boolean, default: true },
      defaultTax: { type: String, default: 'GST 18%' },
    },
    businessName: {
      type: String,
      default: '',
    },
    businessAddress: {
      type: String,
      default: '',
    },
    gstNumber: {
      type: String,
      default: '',
    },
    logo: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware to hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

export default User;
