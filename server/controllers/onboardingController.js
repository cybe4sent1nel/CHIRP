import OnboardingResponse from '../models/OnboardingResponse.js';
import Feedback from '../models/Feedback.js';
import nodemailer from 'nodemailer';

// Submit onboarding response
export const submitOnboarding = async (req, res) => {
  try {
    const user_id = req.user.userId;
    const { age_group, interests, referral_source, referral_details, content_preferences } = req.body;

    // Check if user already submitted
    const existing = await OnboardingResponse.findOne({ user_id });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Onboarding already completed'
      });
    }

    const response = new OnboardingResponse({
      user_id,
      age_group,
      interests,
      referral_source,
      referral_details,
      content_preferences
    });

    await response.save();

    res.status(201).json({
      success: true,
      message: 'Onboarding completed successfully',
      data: response
    });

  } catch (error) {
    console.error('Error submitting onboarding:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit onboarding'
    });
  }
};

// Get user's onboarding response
export const getOnboardingResponse = async (req, res) => {
  try {
    const user_id = req.user.userId;

    const response = await OnboardingResponse.findOne({ user_id });

    res.json({
      success: true,
      data: response,
      completed: !!response
    });

  } catch (error) {
    console.error('Error fetching onboarding:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch onboarding'
    });
  }
};

// Submit feedback
export const submitFeedback = async (req, res) => {
  try {
    const user_id = req.user.userId;
    const {
      overall_rating,
      features_rating,
      what_you_like,
      what_to_improve,
      missing_features,
      would_recommend,
      nps_score,
      contact_for_followup,
      feedback_type
    } = req.body;

    const feedback = new Feedback({
      user_id,
      overall_rating,
      features_rating,
      what_you_like,
      what_to_improve,
      missing_features,
      would_recommend,
      nps_score,
      contact_for_followup,
      feedback_type: feedback_type || 'manual'
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback!',
      data: feedback
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback'
    });
  }
};

// Send feedback request email
export const sendFeedbackEmail = async (userEmail, userName) => {
  try {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const feedbackLink = `${process.env.FRONTEND_URL}/feedback`;

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: userEmail,
      subject: 'We\'d Love Your Feedback on Chirp! 💭',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .emoji { font-size: 48px; text-align: center; margin: 20px 0; }
            .button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🐦 Chirp</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName}!</h2>
              <div class="emoji">💭</div>
              <p>You've been using Chirp for a week now, and we'd love to hear from you!</p>
              <p>Your feedback helps us make Chirp better for everyone. It'll only take 2 minutes.</p>
              <div style="text-align: center;">
                <a href="${feedbackLink}" class="button">Share Your Thoughts</a>
              </div>
              <p style="color: #666; font-size: 14px; margin-top: 30px;">Thank you for being part of our community! 🙏</p>
            </div>
            <div class="footer">
              <p>© 2026 Chirp Social Media Platform</p>
              <p>If you prefer not to receive these emails, you can adjust your preferences in settings.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Feedback email sent to ${userEmail}`);

  } catch (error) {
    console.error('Error sending feedback email:', error);
  }
};
