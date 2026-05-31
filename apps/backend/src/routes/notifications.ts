import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    include: { actor: { select: { username: true, profile: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  res.json(notifications);
}));

router.post('/read', requireAuth, asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user!.id, read: false }, data: { read: true } });
  res.json({ ok: true });
}));

export default router;
