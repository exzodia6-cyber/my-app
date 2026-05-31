import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/stats', asyncHandler(async (_req, res) => {
  const [users, posts, comments, likes, follows, notifications] = await Promise.all([
    prisma.user.count(), prisma.post.count(), prisma.comment.count(), prisma.like.count(), prisma.follow.count(), prisma.notification.count()
  ]);
  res.json({ users, posts, comments, likes, follows, notifications });
}));

router.get('/users', asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, email: true, username: true, role: true, createdAt: true, profile: true }, orderBy: { createdAt: 'desc' }, take: 100 });
  res.json(users);
}));

export default router;
