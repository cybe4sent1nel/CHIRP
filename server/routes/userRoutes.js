import express from 'express';
import { protect } from '../middlewares/auth.js';
import { acceptConnectionRequest, discoverUsers, followUser, getUserConnections, getUserData, getUserProfiles, sendConnectionRequest, unfollowUser, updateUserData } from '../controllers/userController.js';
import { upload } from '../configs/multer.js';
import { getUserRecentMessages } from '../controllers/messageController.js';
import { updateUserSettings, deleteAccount } from '../controllers/safetyController.js';

const userRouter = express.Router()

userRouter.get('/data', protect, getUserData)

userRouter.post('/update', upload.fields([{name: 'profile', maxCount: 1}, {name: 'cover', maxCount: 1}]), protect, updateUserData)

userRouter.post('/discover', protect, discoverUsers)

userRouter.post('/follow', protect, followUser)

userRouter.post('/unfollow', protect, unfollowUser)

userRouter.post('/connect', protect, sendConnectionRequest)

userRouter.post('/accept', protect, acceptConnectionRequest)

userRouter.get('/connections', protect, getUserConnections)

userRouter.post('/profiles', getUserProfiles)

userRouter.get('/recent-messages', protect, getUserRecentMessages)

// Settings & Account Management
userRouter.post('/settings', protect, updateUserSettings)

userRouter.delete('/account', protect, deleteAccount)

export default userRouter;
