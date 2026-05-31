import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../utils/errors.js';

const router = Router();
const postSchema = z.object({ content: z.string().min(1).max(1000) });
const commentSchema = z.object({ content: z.string().min(1).max(400) });
const postInclude = {
  author: { select: { id: true, username: true, profile: true } },
  comments: { orderBy: { createdAt: 'asc' as const }, include: { author: { select: { id: true, username: true, profile: true } } } },
  likes: true,
  _count: { select: { comments: true, likes: true } }
};

router.get('/', requireAuth, asyncHandler(async (_req, res) => {
  const posts = await prisma.post.findMany({ include: postInclude, orderBy: { createdAt: 'desc' }, take: 50 });
  res.json(posts);
}));

router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const input = postSchema.parse(req.body);
  const post = await prisma.post.create({ data: { content: input.content, authorId: req.user!.id }, include: postInclude });
  res.status(201).json(post);
}));

router.post('/:id/like', requireAuth, asyncHandler(async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: String(req.params.id) } });
  if (!post) throw new AppError(404, 'Пост не найден');
  const existing = await prisma.like.findUnique({ where: { postId_userId: { postId: post.id, userId: req.user!.id } } });
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    res.json({ liked: false });
    return;
  }
  await prisma.like.create({ data: { postId: post.id, userId: req.user!.id } });
  if (post.authorId !== req.user!.id) await prisma.notification.create({ data: { userId: post.authorId, actorId: req.user!.id, type: 'like', message: 'Ваш пост лайкнули' } });
  res.status(201).json({ liked: true });
}));

router.post('/:id/comments', requireAuth, asyncHandler(async (req, res) => {
  const input = commentSchema.parse(req.body);
  const post = await prisma.post.findUnique({ where: { id: String(req.params.id) } });
  if (!post) throw new AppError(404, 'Пост не найден');
  const comment = await prisma.comment.create({ data: { postId: post.id, authorId: req.user!.id, content: input.content }, include: { author: { select: { id: true, username: true, profile: true } } } });
  if (post.authorId !== req.user!.id) await prisma.notification.create({ data: { userId: post.authorId, actorId: req.user!.id, type: 'comment', message: 'Ваш пост прокомментировали' } });
  res.status(201).json(comment);
}));

router.get('/user/:username', requireAuth, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { username: String(req.params.username) } });
  if (!user) throw new AppError(404, 'Пользователь не найден');
  const posts = await prisma.post.findMany({ where: { authorId: user.id }, include: postInclude, orderBy: { createdAt: 'desc' } });
  res.json(posts);
}));

export default router;
