import ActivityLog from '../models/ActivityLog.js';

/**
 * Logs an activity to the database.
 * @param {Object} req - The Express request object (used to extract user info and IP)
 * @param {String} action - The action performed (e.g., 'Created Product')
 * @param {String} module - The module name (enum in schema)
 * @param {String} details - Details about the action
 */
export const logActivity = async (req, action, module, details) => {
  try {
    if (!req.user) return; // Cannot log without user context

    const ownerId = req.user.ownerId || req.user._id;

    // Get IP address safely
    const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';

    await ActivityLog.create({
      ownerId,
      user: req.user._id,
      action,
      module,
      details,
      ipAddress,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
