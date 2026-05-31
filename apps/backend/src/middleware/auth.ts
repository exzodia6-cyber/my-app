import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/errors.js';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role };
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return next(new AppError(401, 'Authorization token is required'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? 'dev-secret') as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true, role: true } });
    if (!user) return next(new AppError(401, 'User not found'));
    req.user = user;
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token'));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== 'ADMIN') return next(new AppError(403, 'Admin access required'));
  next();
}
