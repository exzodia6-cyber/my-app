import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';

const router = Router();
router.use(requireAuth, requireAdmin);

const itemSchema = z.object({ weapon: z.string(), skin: z.string(), rarity: z.any(), price: z.number().int().positive(), imageUrl: z.string(), wear: z.any() });
const caseSchema = z.object({ name: z.string(), description: z.string(), price: z.number().int().positive(), imageUrl: z.string(), accentColor: z.string().optional() });

router.post('/items', asyncHandler(async (req, res) => res.status(201).json(await prisma.item.create({ data: itemSchema.parse(req.body) }))));
router.put('/items/:id', asyncHandler(async (req, res) => res.json(await prisma.item.update({ where: { id: req.params.id }, data: itemSchema.partial().parse(req.body) }))));
router.post('/cases', asyncHandler(async (req, res) => res.status(201).json(await prisma.case.create({ data: caseSchema.parse(req.body) }))));
router.put('/cases/:id', asyncHandler(async (req, res) => res.json(await prisma.case.update({ where: { id: req.params.id }, data: caseSchema.partial().parse(req.body) }))));
router.put('/cases/:caseId/items/:itemId', asyncHandler(async (req, res) => {
  const { chance } = z.object({ chance: z.number().positive() }).parse(req.body);
  res.json(await prisma.caseItem.upsert({ where: { caseId_itemId: { caseId: req.params.caseId, itemId: req.params.itemId } }, update: { chance }, create: { caseId: req.params.caseId, itemId: req.params.itemId, chance } }));
}));
router.post('/users/:id/topup', asyncHandler(async (req, res) => {
  const { amount } = z.object({ amount: z.number().int().positive() }).parse(req.body);
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { balance: { increment: amount } }, select: { id: true, username: true, balance: true } });
  await prisma.history.create({ data: { userId: user.id, type: 'BALANCE_TOPUP', title: 'Admin balance top-up', metadata: { amount } } });
  res.json(user);
}));

export default router;
