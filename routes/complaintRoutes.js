const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { verifyAuth } = require('../utils/authHelpers');

// Generate unique ticket number CMP-YYYY-XXXX
const generateTicketNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Complaint.countDocuments();
  const sequence = (count + 1).toString().padStart(4, '0');
  return `CMP-${year}-${sequence}`;
};

// POST /api/complaints
router.post('/', async (req, res) => {
  try {
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const { title, description, category, priority } = req.body;
    if (!title || !description || !category || !priority) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const ticketNumber = await generateTicketNumber();

    const complaint = await Complaint.create({
      ticketNumber,
      user: user._id,
      title,
      description,
      category,
      priority,
      status: 'Pending'
    });

    return res.status(201).json(complaint);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/complaints/my
router.get('/my', async (req, res) => {
  try {
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const complaints = await Complaint.find({ user: user._id }).sort({ createdAt: -1 });
    return res.json(complaints);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/complaints/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const complaint = await Complaint.findById(req.params.id).populate('user', 'name email');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Authorization check: User can only access their own complaint unless admin
    if (complaint.user._id.toString() !== user._id.toString() && user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.json(complaint);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// PUT /api/complaints/:id
router.put('/:id', async (req, res) => {
  try {
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (complaint.user.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (complaint.status === 'Resolved') {
      return res.status(400).json({ message: 'Resolved complaints cannot be edited' });
    }

    const { title, description, category, priority } = req.body;
    complaint.title = title || complaint.title;
    complaint.description = description || complaint.description;
    complaint.category = category || complaint.category;
    complaint.priority = priority || complaint.priority;

    const updated = await complaint.save();
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// DELETE /api/complaints/:id
router.delete('/:id', async (req, res) => {
  try {
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (complaint.user.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Complaint.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;