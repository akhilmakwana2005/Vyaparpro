import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  addStaff,
  getStaff,
  deleteStaff,
} from '../controllers/authController.js';
import { protect, ownerOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);

// Staff routes (Owner only)
router.route('/staff')
  .post(protect, ownerOnly, addStaff)
  .get(protect, ownerOnly, getStaff);
router.route('/staff/:id')
  .delete(protect, ownerOnly, deleteStaff);

export default router;
