const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Complaint = require('../models/Complaint');
const Response = require('../models/Response');
const User = require('../models/User');
const Department = require('../models/Department');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { sendStatusChangeEmail, sendFlaggedComplaintEmail } = require('../utils/emailService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images, PDFs, and documents are allowed'));
  }
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

router.post('/', authMiddleware, upload.array('attachments', 5), async (req, res) => {
  try {
    const { title, description, deptId } = req.body;

    if (!title || !description || !deptId) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size
    })) : [];

    const complaint = new Complaint({
      userId: req.user.userId,
      title,
      description,
      deptId,
      status: 'pending',
      attachments
    });

    await complaint.save();

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('userId', 'name email')
      .populate('deptId', 'name');

    res.status(201).json({ success: true, data: populatedComplaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = {};

    if (req.user.role !== 'admin') {
      query.userId = req.user.userId;
    }

    const complaints = await Complaint.find(query)
      .populate('userId', 'name email')
      .populate('deptId', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/department/:deptId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const complaints = await Complaint.find({ deptId: req.params.deptId })
      .populate('userId', 'name email')
      .populate('deptId', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('deptId', 'name');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (req.user.role !== 'admin' && complaint.userId._id.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const responses = await Response.find({ complaintId: req.params.id })
      .populate('deptId', 'name')
      .sort({ date: 1 });

    res.json({
      success: true,
      data: {
        ...complaint.toObject(),
        responses
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, reason } = req.body;

    if (!['pending', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const oldStatus = complaint.status;

    // Update status
    complaint.status = status;
    await complaint.save();

    // If reason provided, create a response
    if (reason && reason.trim()) {
      const response = new Response({
        complaintId: req.params.id,
        deptId: complaint.deptId,
        message: `Status changed to "${status.replace('_', ' ')}" - Reason: ${reason}`,
        date: new Date()
      });
      await response.save();
    }

    // Send email notification to user
    try {
      const user = await User.findById(complaint.userId);
      if (user) {
        await sendStatusChangeEmail(
          user.email,
          user.name,
          complaint.title,
          oldStatus,
          status,
          reason || 'No reason provided'
        );
      }
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
      // Don't fail the request if email fails
    }

    const populatedComplaint = await Complaint.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('deptId', 'name');

    res.json({ success: true, data: populatedComplaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Flag/unflag complaint - admin only
router.patch('/:id/flag', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { flagged, flagNote } = req.body;

    if (typeof flagged !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Flagged status must be a boolean' });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Update flag fields
    complaint.flagged = flagged;
    if (flagNote !== undefined) {
      complaint.flagNote = flagNote;
    }
    await complaint.save();

    if (flagged === true) {
      try {
        // Populate user details
        const populatedComplaint = await Complaint.findById(complaint._id).populate('userId', 'name email');
        if (populatedComplaint && populatedComplaint.userId) {
          await sendFlaggedComplaintEmail(
            populatedComplaint.userId.email,
            populatedComplaint.userId.name,
            populatedComplaint.title,
            flagNote
          );
        }
      } catch (emailError) {
        // Email failure must never crash the server or fail the API response
        console.error('Flag email error:', emailError);
      }
    }

    const populatedComplaint = await Complaint.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('deptId', 'name');

    res.json({ success: true, data: populatedComplaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
