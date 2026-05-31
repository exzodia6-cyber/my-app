import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { asyncHandler, AppError } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const credentials = z.object({ email: z.string().email(), password: z.string().min(6) });
const registerSchema = credentials.extend({ username: z.string().min(3).max(24) });

function token(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET ?? 'dev-secret', { expiresIn: '7d' });
}

const publicUser = { id: true, email: true, username: true, role: true, balance: true, createdAt: true } as const;

router.post('/register', asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({ data: { email: data.email, username: data.username, passwordHash }, select: publicUser });
  res.status(201).json({ user, token: token(user.id) });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const data = credentials.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) throw new AppError(401, 'Invalid credentials');
  const { passwordHash: _passwordHash, ...safeUser } = user;
  res.json({ user: safeUser, token: token(user.id) });
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id }, select: publicUser });
  res.json(user);
}));

export default router;
