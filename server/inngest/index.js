import { Inngest } from "inngest";
import User from "../models/User.js";
import Connection from "../models/Connection.js";
import sendEmail from "../configs/nodeMailer.js";
import Message from "../models/Message.js";
import Story from "../models/Story.js";
import Post from "../models/Post.js";
import { sendFeedbackEmail } from "../controllers/onboardingController.js";

// Create a client to send and receive events
export const inngest = new Inngest({ 
  id: "chirp-app",
  eventKey: process.env.INNGEST_EVENT_KEY || process.env.INNGEST_SIGNING_KEY
});

// Inngest function to save user data to a database
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" }, // function metadata
  { event: "clerk/user.created" }, // event trigger
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;
    let username = email_addresses[0].email_address.split("@")[0];
    const email = email_addresses[0].email_address;

    // Check availability of username
    const user = await User.findOne({ username });

    if (user) {
      username = username + Math.floor(Math.random() * 10000);
    }

    // Generate unique DiceBear avatar if no image_url provided
    let profilePicture = image_url;
    if (!image_url) {
      profilePicture = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}&scale=80`;
    }

    const userData = {
      _id: id,
      email,
      full_name: first_name + " " + last_name,
      profile_picture: profilePicture,
      username,
    };

    await User.create(userData);
  }
);

// Ingest function to update user data in database (to be added later)
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" }, // function metadata
  { event: "clerk/user.updated" }, // event trigger
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;
    const email = email_addresses[0].email_address;

    // Generate unique DiceBear avatar if no image_url provided
    let profilePicture = image_url;
    if (!image_url) {
      profilePicture = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}&scale=80`;
    }

    const updatedUserData = {
      email,
      full_name: first_name + " " + last_name,
      profile_picture: profilePicture,
    };
    await User.findByIdAndUpdate(id, updatedUserData);
  }
);

// Ingest function to delete user from database
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk" }, // function metadata
  { event: "clerk/user.deleted" }, // event trigger
  async ({ event }) => {
    const { id } = event.data;
    await User.findByIdAndDelete(id);
  }
);

const sendNewConnectionRequestReminder = inngest.createFunction(
  { id: "send-new-connection-request-reminder" },
  { event: "app/connection-request" },
  async ({ event, step }) => {
    const { connectionId } = event.data;

    await step.run("send-connection-request-mail", async () => {
      const connection = await Connection.findById(connectionId).populate(
        "from_user_id to_user_id"
      );
      const subject = "✋ New Connection Request";
      const body = `
      <div style='font-family: Arial, sans-serif; padding: 20px;'>
      <h2>Hi ${connection.to_user_id.full_name},</h2>
      <p>You have a new connection request from ${connection.from_user_id.full_name} - @${connection.from_user_id.username}</p>
      <p>Click <a href="${process.env.FRONTEND_URL}/connections" style="color: #10b981;">here</a> to accept or reject the request</p>
      <br />
      <p>Thanks, <br />Chirp - Stay Connected</p>
      </div>
      `;

      await sendEmail({
        to: connection.to_user_id.email,
        subject,
        body,
      });
    });

    const in24hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await step.sleepUntil("wait-for-24-hour", in24hours);
    await step.run("send-connection-request-reminder", async () => {
      const connection = await Connection.findById(connectionId).populate(
        "from_user_id to_user_id"
      );

      if (connection.status === "accepted") {
        return { message: "Already accepted" };
      }

      const subject = "✋ New Connection Request";
      const body = `
      <div style='font-family: Arial, sans-serif; padding: 20px;'>
      <h2>Hi ${connection.to_user_id.full_name},</h2>
      <p>You have a new connection request from ${connection.from_user_id.full_name} - @${connection.from_user_id.username}</p>
      <p>Click <a href="${process.env.FRONTEND_URL}/connections" style="color: #10b981;">here</a> to accept or reject the request</p>
      <br />
      <p>Thanks, <br />Chirp - Stay Connected</p>
      </div>
      `;

      await sendEmail({
        to: connection.to_user_id.email,
        subject,
        body,
      });

      return { message: "Reminder-sent " };
    });
  }
);

// Inngest function to delete story after 24 hours
const deleteStory = inngest.createFunction(
  { id: "story-delete" },
  { event: "app/story-delete" },
  async ({ event, step }) => {
    const { storyId } = event.data;
    const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await step.sleepUntil("wait-for-24-hours", in24Hours);
    await step.run("delete-story", async () => {
      await Story.findByIdAndDelete(storyId);
      return { message: "Story-deleted" };
    });
  }
);

// Inngest function to send notification of unseen messages everyday at 9 am
const sendNotificationOfUnseenMessages = inngest.createFunction(
  { id: "send-unseen-messages-notification" },
  { cron: "TZ=America/New_York 0 9 * * *" }, //Everyday at 9 AM
  async ({ step }) => {
    const messages = await Message.find({ seen: false }).populate("to_user_id");
    const unseenCount = {};

    messages.map((message) => {
      unseenCount[message.to_user_id._id] =
        (unseenCount[message.to_user_id._id] || 0) + 1;
    });

    for (const userId in unseenCount) {
      const user = await User.findById(userId);

      const subject = `🌨️ You have ${unseenCount[userId]} unseen messages`;

      const body = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Hi ${user.full_name},</h2>
      <p>You have ${unseenCount[userId]} unseen messages</p>
      <p>Click <a href="${process.env.FRONTEND_URL}/messages" style="color: #10b981;">here</a> to view them</p>
      <br/>
      <p>Thanks,<br/>Chirp - Stay Connected</p>
      </div>
      `;

      await sendEmail({
        to: user.email,
        subject,
        body
      })
    }
    return {message: 'Notification sent.'}
  }
);

// Inngest function to cleanup expired stories every hour (fallback)
const cleanupExpiredStories = inngest.createFunction(
  { id: "cleanup-expired-stories" },
  { cron: "0 * * * *" }, // Every hour
  async ({ step }) => {
    await step.run("delete-expired-stories", async () => {
      const result = await Story.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      console.log(`Deleted ${result.deletedCount} expired stories`);
      return { message: `Deleted ${result.deletedCount} expired stories` };
    });
  }
);

// Inngest function to send emails
const sendEmailFunction = inngest.createFunction(
  { id: "send-email" },
  { event: "app/send-email" },
  async ({ event }) => {
    const { to, subject, body } = event.data;
    
    try {
      await sendEmail({ to, subject, body });
      console.log(`Email sent successfully to ${to}`);
      return { message: "Email sent successfully" };
    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }
);

// Weekly Post Analytics Email Report
const sendWeeklyAnalyticsReport = inngest.createFunction(
  { 
    id: "send-weekly-analytics-report",
    cron: "0 9 * * 1" // Every Monday at 9 AM
  },
  { cron: "0 9 * * 1" },
  async ({ step }) => {
    // Get all users who have enabled email reports
    const users = await step.run("fetch-users-with-analytics", async () => {
      return await User.find({ 
        "settings.emailAnalyticsEnabled": true 
      });
    });

    for (const user of users) {
      await step.run(`send-report-${user._id}`, async () => {
        // Get user's posts from last week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const posts = await Post.find({
          user: user._id,
          createdAt: { $gte: oneWeekAgo }
        }).sort({ createdAt: -1 });

        if (posts.length === 0) return;

        // Calculate total analytics
        const totalImpressions = posts.reduce((sum, post) => sum + (post.impressions || 0), 0);
        const totalLikes = posts.reduce((sum, post) => sum + (post.likes_count || 0), 0);
        const totalComments = posts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
        const totalShares = posts.reduce((sum, post) => sum + (post.shares_count || 0), 0);

        // Create HTML email
        const emailBody = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; background: #f9fafb; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 28px; }
              .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0 0; }
              .content { padding: 32px; }
              .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 24px 0; }
              .stat-card { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 20px; border-radius: 8px; text-align: center; }
              .stat-value { font-size: 32px; font-weight: bold; color: #0369a1; margin: 8px 0; }
              .stat-label { color: #64748b; font-size: 14px; }
              .post-item { background: #f9fafb; padding: 16px; border-radius: 8px; margin: 12px 0; border-left: 4px solid #6366f1; }
              .post-stats { display: flex; gap: 16px; margin-top: 12px; font-size: 14px; color: #64748b; }
              .footer { background: #f9fafb; padding: 24px; text-align: center; color: #64748b; font-size: 14px; }
              .cta-button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0; font-weight: 600; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Your Weekly Analytics Report</h1>
                <p>Week of ${new Date(oneWeekAgo).toLocaleDateString()} - ${new Date().toLocaleDateString()}</p>
              </div>
              
              <div class="content">
                <h2 style="color: #1e293b; margin-bottom: 8px;">Hi ${user.full_name}!</h2>
                <p style="color: #64748b; line-height: 1.6;">
                  Here's how your posts performed this week. Keep up the great work! 🚀
                </p>

                <div class="stats-grid">
                  <div class="stat-card" style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);">
                    <div class="stat-value" style="color: #1e40af;">${totalImpressions.toLocaleString()}</div>
                    <div class="stat-label">Total Impressions</div>
                  </div>
                  <div class="stat-card" style="background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);">
                    <div class="stat-value" style="color: #be185d;">${totalLikes}</div>
                    <div class="stat-label">Likes</div>
                  </div>
                  <div class="stat-card" style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);">
                    <div class="stat-value" style="color: #065f46;">${totalComments}</div>
                    <div class="stat-label">Comments</div>
                  </div>
                  <div class="stat-card" style="background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);">
                    <div class="stat-value" style="color: #3730a3;">${totalShares}</div>
                    <div class="stat-label">Shares</div>
                  </div>
                </div>

                <h3 style="color: #1e293b; margin: 32px 0 16px 0;">📊 Your Top Posts</h3>
                ${posts.slice(0, 3).map((post, index) => `
                  <div class="post-item">
                    <strong style="color: #1e293b;">#${index + 1} Post</strong>
                    <p style="color: #64748b; margin: 8px 0; line-height: 1.5;">
                      ${post.content ? post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '') : 'Media post'}
                    </p>
                    <div class="post-stats">
                      <span>👁️ ${post.impressions || 0} views</span>
                      <span>❤️ ${post.likes_count || 0} likes</span>
                      <span>💬 ${post.comments_count || 0} comments</span>
                    </div>
                  </div>
                `).join('')}

                <div style="text-align: center;">
                  <a href="${process.env.CLIENT_URL}/profile" class="cta-button">
                    View Full Analytics Dashboard
                  </a>
                </div>

                <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #0284c7;">
                  <p style="margin: 0; color: #0c4a6e; font-weight: 600;">💡 Pro Tip</p>
                  <p style="margin: 8px 0 0 0; color: #0369a1; font-size: 14px; line-height: 1.6;">
                    Posts with images get 2.3x more engagement. Try adding visuals to your next post!
                  </p>
                </div>
              </div>

              <div class="footer">
                <p>You're receiving this email because you enabled weekly analytics reports.</p>
                <p style="margin-top: 8px;">
                  <a href="${process.env.CLIENT_URL}/settings" style="color: #6366f1;">Manage email preferences</a>
                </p>
                <p style="margin-top: 16px;">© ${new Date().getFullYear()} Chirp. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await sendEmail({
          to: user.email,
          subject: `📊 Your Weekly Analytics Report - ${totalImpressions.toLocaleString()} impressions!`,
          body: emailBody
        });

        console.log(`Weekly analytics report sent to ${user.email}`);
      });
    }

    return { success: true, reportsSent: users.length };
  }
);

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

// Export future Inngest functions
export const functions = [
  syncUserCreation,
  syncUserUpdation,
  syncUserDeletion,
  sendNewConnectionRequestReminder,
  deleteStory,
  sendNotificationOfUnseenMessages,
  cleanupExpiredStories,
  sendEmailFunction,
  sendWeeklyAnalyticsReport,
  sendFeedbackRequest
];
