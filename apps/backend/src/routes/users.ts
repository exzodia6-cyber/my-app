import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { avatarFor, publicUserSelect } from '../utils/social.js';

const router = Router();
const profileSchema = z.object({
  name: z.string().min(2).max(80),
  bio: z.string().max(280).default(''),
  city: z.string().max(80).default(''),
  website: z.string().url().or(z.literal('')).default('')
});

router.get('/search', requireAuth, asyncHandler(async (req, res) => {
  const q = z.string().max(80).optional().parse(req.query.q);
  const users = await prisma.user.findMany({
    where: q ? { OR: [ { username: { contains: q, mode: 'insensitive' } }, { profile: { name: { contains: q, mode: 'insensitive' } } } ] } : undefined,
    select: publicUserSelect,
    take: 20,
    orderBy: { createdAt: 'desc' }
  });
  res.json(users);
}));

router.get('/:username', requireAuth, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { username: String(req.params.username) }, select: publicUserSelect });
  if (!user) throw new AppError(404, 'Пользователь не найден');
  const isFollowing = Boolean(await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: req.user!.id, followingId: user.id } } }));
  res.json({ ...user, isFollowing });
}));

router.put('/me/profile', requireAuth, asyncHandler(async (req, res) => {
  const input = profileSchema.parse(req.body);
  const profile = await prisma.profile.upsert({
    where: { userId: req.user!.id },
    create: { ...input, userId: req.user!.id, avatarUrl: avatarFor(input.name) },
    update: input
  });
  res.json(profile);
}));

router.post('/:username/follow', requireAuth, asyncHandler(async (req, res) => {
  const target = await prisma.user.findUnique({ where: { username: String(req.params.username) } });
  if (!target) throw new AppError(404, 'Пользователь не найден');
  if (target.id === req.user!.id) throw new AppError(400, 'Нельзя подписаться на себя');
  const follow = await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: req.user!.id, followingId: target.id } },
    create: { followerId: req.user!.id, followingId: target.id },
    update: {}
  });
  await prisma.notification.create({ data: { userId: target.id, actorId: req.user!.id, type: 'follow', message: 'На вас подписались' } });
  res.status(201).json(follow);
}));

router.delete('/:username/follow', requireAuth, asyncHandler(async (req, res) => {
  const target = await prisma.user.findUnique({ where: { username: String(req.params.username) } });
  if (!target) throw new AppError(404, 'Пользователь не найден');
  await prisma.follow.deleteMany({ where: { followerId: req.user!.id, followingId: target.id } });
  res.status(204).send();
}));

export default router;
