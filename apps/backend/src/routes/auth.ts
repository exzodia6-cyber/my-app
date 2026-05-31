import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { avatarFor, publicUserSelect } from '../utils/social.js';

const router = Router();
const credentialsSchema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(6).max(100),
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_а-яА-Я-]+$/).optional(),
  name: z.string().min(2).max(80).optional()
});

function createToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET ?? 'dev-secret', { expiresIn: '7d' });
}

router.post('/register', asyncHandler(async (req, res) => {
  const input = credentialsSchema.required({ username: true }).parse(req.body);
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      username: input.username,
      passwordHash,
      profile: { create: { name: input.name ?? input.username, avatarUrl: avatarFor(input.username) } }
    },
    select: publicUserSelect
  }).catch(() => { throw new AppError(409, 'Email или username уже заняты'); });
  res.status(201).json({ token: createToken(user.id), user });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const input = credentialsSchema.omit({ username: true, name: true }).parse(req.body);
  const userWithPassword = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() }, include: { profile: true } });
  if (!userWithPassword || !await bcrypt.compare(input.password, userWithPassword.passwordHash)) {
    throw new AppError(401, 'Неверный email или пароль');
  }
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userWithPassword.id }, select: publicUserSelect });
  res.json({ token: createToken(user.id), user });
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id }, select: publicUserSelect });
  res.json(user);
}));

export default router;
