import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/errors.js';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role };
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    next(new AppError(401, 'Authorization token is required'));
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? 'dev-secret');
    if (typeof payload === 'string' || typeof payload.userId !== 'string') {
      next(new AppError(401, 'Invalid or expired token'));
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true, role: true } });
    if (!user) {
      next(new AppError(401, 'User not found'));
      return;
    }

    req.user = user;
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token'));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== 'ADMIN') {
    next(new AppError(403, 'Admin access required'));
    return;
  }

  next();
}
