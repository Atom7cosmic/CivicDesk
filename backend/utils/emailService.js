// ─── emailService.js — uses Resend HTTP API (works on Render free tier) ───────

const sendNotificationEmail = async (to, subject, html) => {
  if (process.env.EMAIL_ENABLED !== 'true') {
    console.log('Email notifications disabled (EMAIL_ENABLED != true)');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${process.env.EMAIL_FROM_NAME || 'CivicDesk'} <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        html
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Email send failed to', to, '|', data.message || JSON.stringify(data));
      return false;
    }

    console.log('✅ Email sent to', to, '| id:', data.id);
    return true;

  } catch (err) {
    console.error('❌ Email error for', to, '|', err.message);
    return false;
  }
};

// ─── Template functions ────────────────────────────────────────────────────────

const sendStatusChangeEmail = (userEmail, userName, complaintTitle, oldStatus, newStatus, reason) => {
  const subject = `Complaint Status Updated: ${complaintTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: #F1473A; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">CivicDesk — Complaint Status Update</h2>
      </div>
      <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <p style="color: #333; font-size: 16px;">Hello ${userName},</p>
        <p style="color: #555; line-height: 1.6;">Your complaint status has been updated.</p>

        <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #F1473A;">
          <p style="margin: 5px 0; color: #374151;"><strong>Complaint:</strong> ${complaintTitle}</p>
          <p style="margin: 5px 0; color: #374151;"><strong>Previous Status:</strong> ${oldStatus}</p>
          <p style="margin: 5px 0; color: #374151;"><strong>New Status:</strong> <span style="color: #F1473A; font-weight: bold;">${newStatus}</span></p>
        </div>

        <div style="background-color: #fff8f6; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #F0E0DC;">
          <p style="margin: 0 0 10px 0; color: #F1473A; font-weight: bold;">Reason for Change:</p>
          <p style="margin: 0; color: #374151; line-height: 1.5;">${reason}</p>
        </div>

        <p style="color: #555; line-height: 1.6; margin-top: 20px;">You can view your complaint by logging into your account.</p>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/login.html" style="background-color: #F1473A; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">View Complaint</a>
        </div>

        <p style="color: #9ca3af; font-size: 14px; margin-top: 30px; text-align: center;">This is an automated message from CivicDesk. Please do not reply directly to this email.</p>
      </div>
    </div>
  `;
  return sendNotificationEmail(userEmail, subject, html);
};

const sendResponseEmail = (userEmail, userName, complaintTitle, departmentName, message) => {
  const subject = `New Response on Your Complaint: ${complaintTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: #F1473A; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">CivicDesk — New Response Received</h2>
      </div>
      <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <p style="color: #333; font-size: 16px;">Hello ${userName},</p>
        <p style="color: #555; line-height: 1.6;">You have received a new response on your complaint.</p>

        <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #F1473A;">
          <p style="margin: 5px 0; color: #374151;"><strong>Complaint:</strong> ${complaintTitle}</p>
          <p style="margin: 5px 0; color: #374151;"><strong>Department:</strong> ${departmentName}</p>
        </div>

        <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; font-weight: bold;">Message:</p>
          <p style="margin: 0; color: #374151; line-height: 1.6; font-style: italic;">"${message}"</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/login.html" style="background-color: #F1473A; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">View Response</a>
        </div>

        <p style="color: #9ca3af; font-size: 14px; margin-top: 30px; text-align: center;">This is an automated message from CivicDesk. Please do not reply directly to this email.</p>
      </div>
    </div>
  `;
  return sendNotificationEmail(userEmail, subject, html);
};

const sendFlaggedComplaintEmail = (userEmail, userName, complaintTitle, adminNote) => {
  const subject = `Your Complaint Has Been Flagged: ${complaintTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">CivicDesk — Complaint Flagged</h2>
      </div>
      <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <p style="color: #333; font-size: 16px;">Hello ${userName},</p>

        <p style="color: #555; line-height: 1.6;">
          After careful review by our admin team, your complaint titled
          <strong>"${complaintTitle}"</strong> has been marked as suspicious.
        </p>

        <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p style="margin: 0 0 10px 0; color: #dc2626; font-weight: bold;">Admin's Reason:</p>
          <p style="margin: 0; color: #7f1d1d; line-height: 1.5;">${adminNote}</p>
        </div>

        <p style="color: #555; line-height: 1.6;">
          If you believe this is in error, please log in and resubmit your complaint with additional supporting details, or contact our support team.
        </p>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/login.html" style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">View My Complaints</a>
        </div>

        <p style="color: #9ca3af; font-size: 14px; margin-top: 30px; text-align: center;">This is an automated message from CivicDesk. Please do not reply directly to this email.</p>
      </div>
    </div>
  `;
  return sendNotificationEmail(userEmail, subject, html);
};

module.exports = {
  sendNotificationEmail,
  sendStatusChangeEmail,
  sendResponseEmail,
  sendFlaggedComplaintEmail,
};