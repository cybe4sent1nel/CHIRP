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
    },
    notification_settings: {
        messageNotifications: {type: Boolean, default: true},
        mentionNotifications: {type: Boolean, default: true},
        likeNotifications: {type: Boolean, default: true},
        commentNotifications: {type: Boolean, default: true},
        followNotifications: {type: Boolean, default: true},
        emailNotifications: {type: Boolean, default: false},
        pushNotifications: {type: Boolean, default: true},
    },
    account_settings: {
        twoFactorAuth: {type: Boolean, default: false},
        privateAccount: {type: Boolean, default: false},
        allowAIFeatures: {type: Boolean, default: true},
    },
}, {timestamps: true, minimize: false})

// Create a model with schema
const User = mongoose.model('User', userSchema)

export default User;