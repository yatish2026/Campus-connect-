import express from 'express';
import * as clubController from '../controllers/club.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', protectRoute, clubController.listClubs);
router.post('/', protectRoute, clubController.createClub);
router.get('/mine', protectRoute, clubController.myClubs);
router.get('/:id', protectRoute, clubController.getClub);
router.get('/:id/posts', protectRoute, clubController.getClubPosts);
router.post('/:id/follow', protectRoute, clubController.followClub);
router.post('/:id/apply', protectRoute, clubController.applyClub);
router.post('/:id/review', protectRoute, clubController.reviewApplication);

export default router;
