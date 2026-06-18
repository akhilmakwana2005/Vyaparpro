import ActivityLog from '../models/ActivityLog.js';

// @desc    Get all activity logs for the owner
// @route   GET /api/activity-logs
// @access  Private (Owner only)
export const getActivityLogs = async (req, res) => {
  try {
    const ownerId = req.user.role === 'owner' ? req.user._id : req.user.ownerId;
    
    // Allow filtering by module or user via query params
    const filter = { ownerId };
    
    if (req.query.module) filter.module = req.query.module;
    if (req.query.user) filter.user = req.query.user;

    const logs = await ActivityLog.find(filter)
      .populate('user', 'name role')
      .sort({ createdAt: -1 })
      .limit(200); // Limit to last 200 logs for performance

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch activity logs' });
  }
};
