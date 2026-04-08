const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

router.get('/', async (req, res) => {
  try {
    const departments = await Department.find().populate('adminId', 'name');
    res.json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({ success: false, message: 'Please provide name and description' });
    }

    const existingDept = await Department.findOne({ name });
    if (existingDept) {
      return res.status(400).json({ success: false, message: 'Department already exists' });
    }

    const department = new Department({
      name,
      description,
      adminId: req.user.userId
    });

    await department.save();
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
