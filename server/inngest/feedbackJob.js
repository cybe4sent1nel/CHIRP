const { inngest } = require('./client');
const User = require('../models/User');
const { sendFeedbackEmail } = require('../controllers/onboardingController');

// Send feedback request after 7 days of signup
const sendFeedbackRequest = inngest.createFunction(
  { id: 'send-feedback-request' },
  { cron: '0 10 * * *' }, // Run daily at 10 AM
  async ({ step }) => {
    await step.run('find-users-for-feedback', async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      // Find users who signed up exactly 7 days ago
      const users = await User.find({
        created_at: {
          $gte: eightDaysAgo,
          $lt: sevenDaysAgo
        },
        email: { $exists: true, $ne: null }
      }).select('email username');

      console.log(`Found ${users.length} users for feedback request`);

      // Send feedback email to each user
      for (const user of users) {
        try {
          await sendFeedbackEmail(user.email, user.username);
          console.log(`Feedback email sent to ${user.email}`);
        } catch (error) {
          console.error(`Failed to send feedback email to ${user.email}:`, error);
        }
      }

      return { users_contacted: users.length };
    });
  }
);

module.exports = { sendFeedbackRequest };
