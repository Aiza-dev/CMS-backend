const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { verifyAuth } = require('../utils/authHelpers');

// Direct authorization check helper
const checkAdmin = async (req, res) => {
  const user = await verifyAuth(req);
  if (!user || user.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
    return null;
  }
  return user;
};

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const admin = await checkAdmin(req, res);
    if (!admin) return;

    const total = await Complaint.countDocuments();
    const pending = await Complaint.countDocuments({ status: 'Pending' });
    const inProgress = await Complaint.countDocuments({ status: 'In Progress' });
    const resolved = await Complaint.countDocuments({ status: 'Resolved' });
    const highPriority = await Complaint.countDocuments({ priority: 'High' });

    return res.json({ total, pending, inProgress, resolved, highPriority });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/complaints
router.get('/complaints', async (req, res) => {
  try {
    const admin = await checkAdmin(req, res);
    if (!admin) return;

    const { status, category, priority, search } = req.query;
    let query = {};

    if (status && status !== 'All') query.status = status;
    if (category && category !== 'All') query.category = category;
    if (priority && priority !== 'All') query.priority = priority;

    if (search) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }

    const complaints = await Complaint.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    return res.json(complaints);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/complaints/:id/status
router.put('/complaints/:id/status', async (req, res) => {
  try {
    const admin = await checkAdmin(req, res);
    if (!admin) return;

    const { status } = req.body;
    if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.status = status;
    await complaint.save();

    return res.json(complaint);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;