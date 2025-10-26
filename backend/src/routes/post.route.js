import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import * as postController from "../controllers/post.controller.js";

const router = express.Router();

router.get("/", protectRoute, postController.getFeedPosts);
router.get("/user/:username", protectRoute, postController.getPostsByUser);
router.post("/create", protectRoute, postController.createPost);
router.delete("/delete/:id", protectRoute, postController.deletePost);
router.get("/:id", protectRoute, postController.getPostById);
router.post("/:id/comment", protectRoute, postController.createComment);
router.post("/:id/like", protectRoute, postController.likePost);

export default router;
