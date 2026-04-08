const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify transporter on startup
transporter.verify(function(error, success) {
  if (error) {
    console.log('Email service error:', error);
  } else {
    console.log('Email service ready');
  }
});

const sendNotificationEmail = async (to, subject, html) => {
  if (process.env.EMAIL_ENABLED !== 'true') {
    console.log('Email notifications disabled');
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

const sendStatusChangeEmail = async (userEmail, userName, complaintTitle, oldStatus, newStatus, reason) => {
  const subject = `Complaint Status Updated: ${complaintTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">Complaint Status Update</h2>
      </div>
      <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <p style="color: #333; font-size: 16px;">Hello ${userName},</p>
        <p style="color: #555; line-height: 1.6;">Your complaint status has been updated.</p>

        <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #6366f1;">
          <p style="margin: 5px 0; color: #374151;"><strong>Complaint:</strong> ${complaintTitle}</p>
          <p style="margin: 5px 0; color: #374151;"><strong>Previous Status:</strong> ${oldStatus}</p>
          <p style="margin: 5px 0; color: #374151;"><strong>New Status:</strong> <span style="color: #6366f1; font-weight: bold;">${newStatus}</span></p>
        </div>

        <div style="background-color: #eff6ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; color: #1e40af; font-weight: bold;">Reason for Change:</p>
          <p style="margin: 0; color: #1e40af; line-height: 1.5;">${reason}</p>
        </div>

        <p style="color: #555; line-height: 1.6; margin-top: 20px;">You can view the full details and track your complaint by logging into your account.</p>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/login.html" style="background-color: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">View Complaint</a>
        </div>

        <p style="color: #9ca3af; font-size: 14px; margin-top: 30px; text-align: center;">This is an automated message from the Complaint Management System.</p>
      </div>
    </div>
  `;

  return await sendNotificationEmail(userEmail, subject, html);
};

const sendResponseEmail = async (userEmail, userName, complaintTitle, departmentName, message) => {
  const subject = `New Response on Your Complaint: ${complaintTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">New Response Received</h2>
      </div>
      <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <p style="color: #333; font-size: 16px;">Hello ${userName},</p>
        <p style="color: #555; line-height: 1.6;">You have received a new response on your complaint.</p>

        <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #6366f1;">
          <p style="margin: 5px 0; color: #374151;"><strong>Complaint:</strong> ${complaintTitle}</p>
          <p style="margin: 5px 0; color: #374151;"><strong>Department:</strong> ${departmentName}</p>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; font-weight: bold;">Message:</p>
          <p style="margin: 0; color: #374151; line-height: 1.6; font-style: italic;">"${message}"</p>
        </div>

        <p style="color: #555; line-height: 1.6; margin-top: 20px;">You can view the full conversation and track your complaint status by logging into your account.</p>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/login.html" style="background-color: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">View Response</a>
        </div>

        <p style="color: #9ca3af; font-size: 14px; margin-top: 30px; text-align: center;">This is an automated message from the Complaint Management System.</p>
      </div>
    </div>
  `;

  return await sendNotificationEmail(userEmail, subject, html);
};

async function sendFlaggedComplaintEmail(userEmail, userName, complaintTitle, adminNote) {
  const subject = `Your Complaint Has Been Flagged: ${complaintTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">CivicDesk — Complaint Flagged</h2>
      </div>
      <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <p style="color: #333; font-size: 16px;">Hello ${userName},</p>

        <p style="color: #555; line-height: 1.6;">
          Thank you for using CivicDesk. After careful review by our admin team, your complaint titled
          <strong>${complaintTitle}</strong> has been flagged as suspicious.
        </p>

        <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p style="margin: 0 0 10px 0; color: #dc2626; font-weight: bold;">Admin's Reason:</p>
          <p style="margin: 0; color: #7f1d1d; line-height: 1.5;">${adminNote}</p>
        </div>

        <p style="color: #555; line-height: 1.6;">
          A flagged complaint indicates that our review team has identified concerns about its authenticity or validity.
          If you believe this is an error, please log in and resubmit with additional supporting details, or contact our support team.
        </p>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/login.html" style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">View My Complaints</a>
        </div>

        <p style="color: #9ca3af; font-size: 14px; margin-top: 30px; text-align: center;">This is an automated message from CivicDesk. Please do not reply directly to this email.</p>
      </div>
    </div>
  `;

  return await sendNotificationEmail(userEmail, subject, html);
}

module.exports = {
  sendNotificationEmail,
  sendStatusChangeEmail,
  sendResponseEmail,
  sendFlaggedComplaintEmail,
};
