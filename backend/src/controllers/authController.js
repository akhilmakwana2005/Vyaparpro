import User from '../models/User.js';
import Notification from '../models/Notification.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, mobile, password } = req.body;

  try {
    const userExists = await User.findOne({ $or: [{ email }, { mobile }] });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists with that email or mobile' });
    }

    const user = await User.create({
      name,
      email,
      mobile,
      password,
    });

    if (user) {
      const token = generateToken(res, user._id);
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        ownerId: user.ownerId,
        businessName: user.businessName,
        businessAddress: user.businessAddress,
        gstNumber: user.gstNumber,
        taxSettings: user.taxSettings,
        token: token,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { emailOrMobile, password } = req.body;

  try {
    const user = await User.findOne({ 
      $or: [{ email: emailOrMobile }, { mobile: emailOrMobile }] 
    });

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(res, user._id);
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        ownerId: user.ownerId,
        businessName: user.businessName,
        businessAddress: user.businessAddress,
        gstNumber: user.gstNumber,
        taxSettings: user.taxSettings,
        token: token,
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        ownerId: user.ownerId,
        businessName: user.businessName,
        businessAddress: user.businessAddress,
        gstNumber: user.gstNumber,
        taxSettings: user.taxSettings,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      if (req.body.name !== undefined) user.name = req.body.name || user.name;
      if (req.body.email !== undefined) user.email = req.body.email || user.email;
      if (req.body.mobile !== undefined) user.mobile = req.body.mobile || user.mobile;
      if (req.body.businessName !== undefined) user.businessName = req.body.businessName;
      if (req.body.businessAddress !== undefined) user.businessAddress = req.body.businessAddress;
      if (req.body.gstNumber !== undefined) user.gstNumber = req.body.gstNumber;

      if (req.body.taxSettings) {
        user.taxSettings = {
          ...user.taxSettings,
          ...req.body.taxSettings,
        };
      }

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        role: updatedUser.role,
        ownerId: updatedUser.ownerId,
        businessName: updatedUser.businessName,
        businessAddress: updatedUser.businessAddress,
        gstNumber: updatedUser.gstNumber,
        taxSettings: updatedUser.taxSettings,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a staff member
// @route   POST /api/auth/staff
// @access  Private/Owner
export const addStaff = async (req, res) => {
  const { name, email, mobile, password } = req.body;

  try {
    const userExists = await User.findOne({ $or: [{ email }, { mobile }] });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists with that email or mobile' });
    }

    const staffUser = await User.create({
      name,
      email,
      mobile,
      password,
      role: 'staff',
      ownerId: req.user._id,
    });

    // Create a notification for the owner
    await Notification.create({
      user: req.user._id,
      title: 'New Staff Member Added',
      message: `${name} has been added as a staff member.`,
      type: 'system'
    });

    res.status(201).json({
      _id: staffUser._id,
      name: staffUser.name,
      email: staffUser.email,
      mobile: staffUser.mobile,
      role: staffUser.role,
      createdAt: staffUser.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all staff members for the owner
// @route   GET /api/auth/staff
// @access  Private/Owner
export const getStaff = async (req, res) => {
  try {
    const staff = await User.find({ ownerId: req.user._id, role: 'staff' }).select('-password');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a staff member
// @route   DELETE /api/auth/staff/:id
// @access  Private/Owner
export const deleteStaff = async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);

    if (staff && staff.ownerId.toString() === req.user._id.toString()) {
      await User.deleteOne({ _id: staff._id });
      res.json({ message: 'Staff member removed' });
    } else {
      res.status(404).json({ message: 'Staff member not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

