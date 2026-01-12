import mongoose from 'mongoose';

const userOnboardingSchema = mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        ref: 'User'
    },
    age: {
        type: String,
        enum: ['13-17', '18-25', '26-35', '36-50', '50+']
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other']
    },
    contentCategories: [{
        type: String,
        enum: ['Tech', 'Entertainment', 'Sports', 'News', 'Gaming', 'Music', 'Fashion', 'Food']
    }],
    appPurpose: [{
        type: String,
        enum: ['Entertainment', 'Learning', 'Networking', 'News', 'Shopping', 'Gaming']
    }],
    contentTypes: [{
        type: String,
        enum: ['Videos', 'Images', 'Articles', 'Polls', 'Reels', 'Live']
    }],
    activeTimePreference: [{
        type: String,
        enum: ['Morning (6AM-12PM)', 'Afternoon (12PM-6PM)', 'Evening (6PM-12AM)', 'Night (12AM-6AM)']
    }],
    expectedEngagementLevel: {
        type: String,
        enum: ['casual', 'regular', 'frequent', 'very_frequent'],
        default: 'regular'
    },
    notificationPreferences: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false }
    },
    isOnboarded: {
        type: Boolean,
        default: true
    },
    onboardedAt: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const UserOnboarding = mongoose.model('UserOnboarding', userOnboardingSchema);

export default UserOnboarding;
