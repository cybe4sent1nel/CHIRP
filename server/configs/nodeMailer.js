import nodemailer from "nodemailer";

// Create a transporter object using SMTP settings from .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Send mail function
const sendEmail = async ({ to, subject, body }) => {
  const response = await transporter.sendMail({
    from: process.env.SENDER_EMAIL || `"Chirp" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html: body,
  });
  return response;
};

export default sendEmail;
