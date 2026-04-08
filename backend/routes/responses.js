const express = require('express');
const router = express.Router();
const Response = require('../models/Response');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Department = require('../models/Department');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { sendResponseEmail } = require('../utils/emailService');

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { complaintId, message } = req.body;

    if (!complaintId || !message) {
      return res.status(400).json({ success: false, message: 'Please provide complaintId and message' });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const response = new Response({
      complaintId,
      deptId: complaint.deptId,
      message,
      date: new Date()
    });

    await response.save();

    if (complaint.status === 'pending') {
      complaint.status = 'in_progress';
      await complaint.save();
    }

    const populatedResponse = await Response.findById(response._id)
      .populate('deptId', 'name');

    // Send email notification to user
    try {
      const user = await User.findById(complaint.userId);
      const department = await Department.findById(complaint.deptId);
      if (user && department) {
        await sendResponseEmail(
          user.email,
          user.name,
          complaint.title,
          department.name,
          message
        );
      }
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({ success: true, data: populatedResponse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:complaintId', authMiddleware, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.complaintId);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (req.user.role !== 'admin' && complaint.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const responses = await Response.find({ complaintId: req.params.complaintId })
      .populate('deptId', 'name')
      .sort({ date: 1 });

    res.json({ success: true, data: responses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
