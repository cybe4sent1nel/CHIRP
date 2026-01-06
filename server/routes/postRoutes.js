import express from "express";
import { upload } from "../configs/multer.js";
import { protect } from "../middlewares/auth.js";
import {
  addPost,
  getFeedPost,
  likePost,
  checkRepostStatus,
  toggleRepost,
  sharePost,
  updatePost,
  deletePost,
  trackPostView,
  trackProfileClick,
} from "../controllers/postController.js";

const postRouter = express.Router();

postRouter.post("/add", upload.array("images", 4), protect, addPost);
postRouter.get("/feed", protect, getFeedPost);
postRouter.post("/like", protect, likePost);
postRouter.get("/repost-status/:id", protect, checkRepostStatus);
postRouter.post("/repost", protect, toggleRepost);
postRouter.post("/share", protect, sharePost);
postRouter.put("/update", protect, updatePost);
postRouter.delete("/delete/:id", protect, deletePost);
postRouter.post("/view/:postId", protect, trackPostView);
postRouter.post("/profile-click/:postId", protect, trackProfileClick);

export default postRouter;
