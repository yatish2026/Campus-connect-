import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import * as notificationController from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", protectRoute, notificationController.getUserNotifications);
router.put(
  "/:id/read",
  protectRoute,
  notificationController.markNotificationAsRead
);
router.delete("/:id", protectRoute, notificationController.deleteNotification);

export default router;
