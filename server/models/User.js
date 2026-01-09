import mongoose from 'mongoose'

const userSchema = mongoose.Schema({
    _id: {type: String, required: true},
    email: {type: String, required: true},
    full_name: {type: String, required: true},
    username: {type: String, unique: true},
    // Custom auth fields
    password: {type: String}, // For email/password auth (hashed)
    authProvider: {type: String, enum: ['clerk', 'local', 'google'], default: 'clerk'},
    googleId: {type: String}, // For Google OAuth
    emailVerified: {type: Boolean, default: false},
    verificationToken: {type: String},
    resetPasswordToken: {type: String},
    resetPasswordExpires: {type: Date},
    // Existing fields
    bio: {type: String, default: 'Hey there! I am using Chirp!'},
    profile_picture: {type: String, default: ''},
    cover_photo: {type: String, default: ''},
    location: {type: String, default: ''},
    // Extended profile fields (LinkedIn-like)
    job_title: {type: String, default: ''},
    company: {type: String, default: ''},
    school: {type: String, default: ''},
    education: [{
        degree: String,
        field: String,
        school: String,
        startYear: String,
        endYear: String,
        current: {type: Boolean, default: false}
    }],
    experience: [{
        title: String,
        company: String,
        location: String,
        startDate: String,
        endDate: String,
        current: {type: Boolean, default: false},
        description: String
    }],
    certificates: [{
        name: String,
        issuer: String,
        issueDate: String,
        credentialId: String,
        credentialUrl: String
    }],
    skills: [{type: String}],
    country: {type: String, default: ''},
    city: {type: String, default: ''},
    website: {type: String, default: ''},
    linkedin: {type: String, default: ''},
    github: {type: String, default: ''},
    twitter: {type: String, default: ''},
    // Profile views tracking
    profile_views: [{
        viewer: {type: String, ref: 'User'},
        viewedAt: {type: Date, default: Date.now}
    }],
    unique_viewers: {type: Number, default: 0},
    followers: [{type: String, ref: 'User'}],
    following: [{type: String, ref: 'User'}],
    connections: [{type: String, ref: 'User'}],
    privacy_settings: {
        dmFromEveryone: {type: Boolean, default: true},
        allowMessagesFromNonConnections: {type: Boolean, default: true},
        showOnlineStatus: {type: Boolean, default: true},
        showLastSeen: {type: Boolean, default: true},
        allowProfileVisits: {type: Boolean, default: true},
        allowComments: {type: Boolean, default: true},
        allowTagging: {type: Boolean, default: true},
        // Field visibility settings
        showEmail: {type: Boolean, default: false},
        showLocation: {type: Boolean, default: true},
        showJobTitle: {type: Boolean, default: true},
        showCompany: {type: Boolean, default: true},
        showEducation: {type: Boolean, default: true},
        showExperience: {type: Boolean, default: true},
        showCertificates: {type: Boolean, default: true},
        showSkills: {type: Boolean, default: true},
        showWebsite: {type: Boolean, default: true},
        showSocialLinks: {type: Boolean, default: true},
    },
    notification_settings: {
        messageNotifications: {type: Boolean, default: true},
        mentionNotifications: {type: Boolean, default: true},
        likeNotifications: {type: Boolean, default: true},
        commentNotifications: {type: Boolean, default: true},
        followNotifications: {type: Boolean, default: true},
        profileViewNotifications: {type: Boolean, default: true},
        emailNotifications: {type: Boolean, default: false},
        pushNotifications: {type: Boolean, default: true},
    },
    account_settings: {
        twoFactorAuth: {type: Boolean, default: false},
        privateAccount: {type: Boolean, default: false},
        allowAIFeatures: {type: Boolean, default: true},
    },
    // Login tracking for security
    lastLoginLocation: {type: String},
    lastLoginDevice: {type: String},
    lastLoginIP: {type: String},
    lastLoginAt: {type: Date},
}, {timestamps: true, minimize: false})

// Create a model with schema
const User = mongoose.model('User', userSchema)

export default User;