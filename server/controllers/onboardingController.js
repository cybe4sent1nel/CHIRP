import UserOnboarding from '../models/UserOnboarding.js';
import User from '../models/User.js';
import sendEmail from '../configs/nodeMailer.js';

// Save onboarding data
export const saveOnboardingData = async (req, res) => {
    try {
        const userId = req.userId;
        console.log('[ONBOARDING] Request headers:', req.headers.authorization ? 'Auth header present' : 'No auth header');
        console.log('[ONBOARDING] req.userId:', userId);
        
        if (!userId) {
            console.error('[ONBOARDING] No userId found in request');
            return res.status(401).json({
                success: false,
                message: 'Not authorized - no user ID found'
            });
        }

        const {
            age,
            gender,
            contentCategories,
            appPurpose,
            contentTypes,
            activeTimePreference,
            expectedEngagementLevel,
            notificationPreferences
        } = req.body;

        console.log('[ONBOARDING] Saving onboarding data for user:', userId);

        // Check if onboarding data already exists
        let onboardingData = await UserOnboarding.findOne({ userId });

        if (onboardingData) {
            // Update existing
            onboardingData = await UserOnboarding.findByIdAndUpdate(
                onboardingData._id,
                {
                    age,
                    gender,
                    contentCategories,
                    appPurpose,
                    contentTypes,
                    activeTimePreference,
                    expectedEngagementLevel,
                    notificationPreferences,
                    isOnboarded: true,
                    lastUpdated: new Date()
                },
                { new: true }
            );
        } else {
            // Create new
            onboardingData = new UserOnboarding({
                userId,
                age,
                gender,
                contentCategories,
                appPurpose,
                contentTypes,
                activeTimePreference,
                expectedEngagementLevel,
                notificationPreferences,
                isOnboarded: true
            });

            await onboardingData.save();
        }

        // Update user's notification settings
        await User.findByIdAndUpdate(
            userId,
            {
                notification_settings: {
                    emailNotifications: notificationPreferences?.email || false,
                    pushNotifications: notificationPreferences?.push || true,
                }
            }
        );

        console.log('[ONBOARDING] ✅ Onboarding data saved successfully for user:', userId);

        res.json({
            success: true,
            message: 'Onboarding data saved successfully',
            onboardingData
        });

    } catch (error) {
        console.error('[ONBOARDING] ❌ Error saving onboarding data:', error.message);
        console.error('[ONBOARDING] Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to save onboarding data: ' + error.message,
            error: error.message
        });
    }
};

// Check if user is onboarded
export const checkOnboardingStatus = async (req, res) => {
    try {
        const userId = req.userId;

        console.log('[ONBOARDING] Checking onboarding status for user:', userId);

        const onboardingData = await UserOnboarding.findOne({ userId });

        const isOnboarded = onboardingData ? onboardingData.isOnboarded : false;

        console.log('[ONBOARDING] User onboarding status:', isOnboarded);

        res.json({
            success: true,
            isOnboarded,
            data: onboardingData || null
        });

    } catch (error) {
        console.error('[ONBOARDING] Error checking onboarding status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check onboarding status',
            error: error.message
        });
    }
};

// Get personalization data for feed
export const getPersonalizationData = async (req, res) => {
    try {
        const userId = req.userId;

        console.log('[ONBOARDING] Fetching personalization data for user:', userId);

        const onboardingData = await UserOnboarding.findOne({ userId });

        if (!onboardingData) {
            return res.json({
                success: true,
                message: 'No personalization data found',
                personalization: null
            });
        }

        res.json({
            success: true,
            personalization: {
                contentCategories: onboardingData.contentCategories,
                contentTypes: onboardingData.contentTypes,
                activeTimePreference: onboardingData.activeTimePreference,
                appPurpose: onboardingData.appPurpose,
                engagementLevel: onboardingData.expectedEngagementLevel
            }
        });

    } catch (error) {
        console.error('[ONBOARDING] Error fetching personalization data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch personalization data',
            error: error.message
        });
    }
};

// Update onboarding data
export const updateOnboardingData = async (req, res) => {
    try {
        const userId = req.userId;
        const {
            age,
            gender,
            contentCategories,
            appPurpose,
            contentTypes,
            activeTimePreference,
            expectedEngagementLevel,
            notificationPreferences
        } = req.body;

        console.log('[ONBOARDING] Updating onboarding data for user:', userId);

        const onboardingData = await UserOnboarding.findOneAndUpdate(
            { userId },
            {
                age,
                gender,
                contentCategories,
                appPurpose,
                contentTypes,
                activeTimePreference,
                expectedEngagementLevel,
                notificationPreferences,
                lastUpdated: new Date()
            },
            { new: true }
        );

        if (!onboardingData) {
            return res.status(404).json({
                success: false,
                message: 'Onboarding data not found'
            });
        }

        console.log('[ONBOARDING] Onboarding data updated successfully');

        res.json({
            success: true,
            message: 'Onboarding data updated successfully',
            onboardingData
        });

    } catch (error) {
        console.error('[ONBOARDING] Error updating onboarding data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update onboarding data',
            error: error.message
        });
    }
};

// Get all personalization data for analytics
export const getAllPersonalizationStats = async (req, res) => {
    try {
        console.log('[ONBOARDING] Fetching personalization stats');

        const stats = await UserOnboarding.aggregate([
            {
                $group: {
                    _id: null,
                    totalOnboarded: {
                        $sum: {
                            $cond: ['$isOnboarded', 1, 0]
                        }
                    },
                    topCategories: {
                        $push: '$contentCategories'
                    },
                    topContentTypes: {
                        $push: '$contentTypes'
                    },
                    ageDistribution: {
                        $push: '$age'
                    },
                    engagementDistribution: {
                        $push: '$expectedEngagementLevel'
                    }
                }
            }
        ]);

        // Count occurrences
        const processStats = (arr) => {
            const counts = {};
            arr.flat().forEach(item => {
                if (item) {
                    counts[item] = (counts[item] || 0) + 1;
                }
            });
            return counts;
        };

        const processedStats = stats[0] ? {
            totalOnboarded: stats[0].totalOnboarded,
            topCategories: processStats(stats[0].topCategories),
            topContentTypes: processStats(stats[0].topContentTypes),
            ageDistribution: processStats(stats[0].ageDistribution),
            engagementDistribution: processStats(stats[0].engagementDistribution)
        } : null;

        console.log('[ONBOARDING] Personalization stats fetched');

        res.json({
            success: true,
            stats: processedStats
        });

    } catch (error) {
        console.error('[ONBOARDING] Error fetching personalization stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch personalization stats',
            error: error.message
        });
    }
};

// Send feedback email (used by Inngest)
export const sendFeedbackEmail = async (email, username) => {
    try {
        const emailBody = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f9fafb; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; text-align: center; }
                    .header h1 { color: white; margin: 0; font-size: 28px; }
                    .content { padding: 32px; }
                    .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0; font-weight: 600; }
                    .footer { background: #f9fafb; padding: 24px; text-align: center; color: #64748b; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🐦 We'd Love Your Feedback!</h1>
                    </div>
                    
                    <div class="content">
                        <h2 style="color: #1e293b;">Hi ${username}!</h2>
                        <p style="color: #64748b; line-height: 1.6;">
                            You've been on Chirp for a week now! We'd love to hear what you think about your experience.
                        </p>
                        <p style="color: #64748b; line-height: 1.6;">
                            Your feedback helps us improve and create the best social media platform for you.
                        </p>
                        
                        <div style="text-align: center;">
                            <a href="${process.env.FRONTEND_URL || 'https://chirp.social'}/feedback" class="cta-button">
                                Share Your Feedback
                            </a>
                        </div>

                        <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #0284c7;">
                            <p style="margin: 0; color: #0c4a6e; font-weight: 600;">💡 Quick Feedback Survey</p>
                            <p style="margin: 8px 0 0 0; color: #0369a1; font-size: 14px; line-height: 1.6;">
                                Just 2 minutes to help us understand your needs better!
                            </p>
                        </div>
                    </div>

                    <div class="footer">
                        <p>Thanks for being part of the Chirp community!</p>
                        <p style="margin-top: 16px;">© ${new Date().getFullYear()} Chirp. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        await sendEmail({
            to: email,
            subject: '🐦 We\'d Love Your Feedback on Chirp!',
            body: emailBody
        });

        console.log(`[ONBOARDING] Feedback email sent to ${email}`);
        return { success: true, message: 'Feedback email sent' };
    } catch (error) {
        console.error('[ONBOARDING] Error sending feedback email:', error);
        throw error;
    }
};
