require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const departmentRoutes = require('./routes/departments');
const responseRoutes = require('./routes/responses');

const User = require('./models/User');
const Department = require('./models/Department');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'https://civic-desk-tau.vercel.app',
    'http://localhost:5000'
  ],
  credentials: true
}));
app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/responses', responseRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── TEMPORARY DEBUG ROUTE — DELETE AFTER FIXING EMAIL ──────────────────────
app.get('/debug-email', async (req, res) => {
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const info = {
    EMAIL_ENABLED: process.env.EMAIL_ENABLED,
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT,
    EMAIL_USERNAME: process.env.EMAIL_USERNAME,
    EMAIL_FROM: process.env.EMAIL_FROM,
    PASSWORD_LENGTH: process.env.EMAIL_PASSWORD?.length,
    FRONTEND_URL: process.env.FRONTEND_URL,
  };

  try {
    await transporter.verify();
    res.json({ smtp: 'CONNECTED ✅', ...info });
  } catch (err) {
    res.json({ smtp: 'FAILED ❌', error: err.message, ...info });
  }
});
// ── END DEBUG ROUTE ──────────────────────────────────────────────────────────

async function seedData() {
  try {
    const deptCount = await Department.countDocuments();

    if (deptCount === 0) {
      console.log('Seeding initial data...');

      const departments = [
        {
          name: 'School of Mechanical, Civil and Electrical Engineering',
          description: 'Part of Faculty of Engineering and Technology - handles mechanical, civil, and electrical engineering complaints'
        },
        {
          name: 'Yogananda School of AI, Computers and Data Science',
          description: 'Part of Faculty of Engineering and Technology - handles AI, computer science, and data science related complaints'
        },
        {
          name: 'School of Business Management',
          description: 'Part of Faculty of Management Sciences - handles business and management related complaints'
        },
        {
          name: 'School of Hospitality and Hotel Management',
          description: 'Part of Faculty of Management Sciences - handles hospitality and hotel management complaints'
        },
        {
          name: 'School of Biotechnology',
          description: 'Part of Faculty of Applied Sciences and Biotechnology - handles biotechnology related complaints'
        },
        {
          name: 'School of Bioengineering and Food Technology',
          description: 'Part of Faculty of Applied Sciences and Biotechnology - handles bioengineering and food technology complaints'
        },
        {
          name: 'School of Physics and Materials Science',
          description: 'Part of Faculty of Sciences - handles physics and materials science complaints'
        },
        {
          name: 'School of Advanced Chemical Sciences',
          description: 'Part of Faculty of Sciences - handles chemistry and advanced chemical sciences complaints'
        },
        {
          name: 'School of Biological and Environmental Sciences',
          description: 'Part of Faculty of Sciences - handles biological and environmental sciences complaints'
        },
        {
          name: 'Chitrakoot School of Liberal Arts',
          description: 'Part of Faculty of Liberal Arts - handles liberal arts education complaints'
        },
        {
          name: 'School of Media and Communications',
          description: 'Part of Faculty of Liberal Arts - handles media and communications related complaints'
        },
        {
          name: 'Yogananda School of Spirituality and Happiness',
          description: 'Part of Faculty of Liberal Arts - handles spirituality and happiness studies complaints'
        },
        {
          name: 'School of Pharmaceutical Sciences',
          description: 'Part of Faculty of Pharmaceutical Sciences - handles pharmaceutical education complaints'
        },
        {
          name: 'School of Law',
          description: 'Part of Faculty of Legal Sciences - handles legal education and law related complaints'
        },
        {
          name: 'School of Agriculture',
          description: 'Part of Faculty of Agriculture - handles agriculture related complaints'
        },
        {
          name: 'School of Yoga and Naturopathy',
          description: 'Part of Faculty of Ancient Indian Wisdom and Yogic Studies - handles yoga and naturopathy complaints'
        }
      ];

      for (const dept of departments) {
        await Department.create(dept);
      }
      console.log('Departments seeded');
    }

    const adminExists = await User.findOne({ email: 'admin@test.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin',
        email: 'admin@test.com',
        password: 'Admin123',
        role: 'admin'
      });
      console.log('Admin user seeded');
    }

    const userExists = await User.findOne({ email: 'user@test.com' });
    if (!userExists) {
      await User.create({
        name: 'John Student',
        email: 'user@test.com',
        password: 'User123',
        role: 'user'
      });
      console.log('Test user seeded');
    }

    console.log('Seed data complete');
  } catch (error) {
    console.error('Seed error:', error);
  }
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connected');
    seedData();
  })
  .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;