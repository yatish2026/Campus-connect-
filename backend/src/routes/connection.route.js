import express from "express";
import * as connectionController from "../controllers/connection.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post(
  "/request/:userId",
  protectRoute,
  connectionController.sendConnectionRequest
);
router.put(
  "/accept/:requestId",
  protectRoute,
  connectionController.acceptConnectionRequest
);
router.put(
  "/reject/:requestId",
  protectRoute,
  connectionController.rejectConnectionRequest
);
// Get all connection requests for the current user
router.get(
  "/requests",
  protectRoute,
  connectionController.getConnectionRequests
);
// Get all connections for a user
router.get("/", protectRoute, connectionController.getUserConnections);
router.delete("/:userId", protectRoute, connectionController.removeConnection);
router.get(
  "/status/:userId",
  protectRoute,
  connectionController.getConnectionStatus
);

export default router;
