import { Router } from 'express';
import { HistoryType, ItemWear, Prisma, Rarity } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';

const router = Router();
router.use(requireAuth, requireAdmin);

const idParamSchema = z.object({ id: z.string().min(1) });
const caseItemParamsSchema = z.object({ caseId: z.string().min(1), itemId: z.string().min(1) });

const itemSchema = z.object({
  weapon: z.string().min(1),
  skin: z.string().min(1),
  rarity: z.nativeEnum(Rarity),
  price: z.number().int().positive(),
  imageUrl: z.string().min(1),
  wear: z.nativeEnum(ItemWear)
});
const caseSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  price: z.number().int().positive(),
  imageUrl: z.string().min(1),
  accentColor: z.string().optional()
});
const caseItemSchema = z.object({ chance: z.number().positive() });
const topUpSchema = z.object({ amount: z.number().int().positive() });

router.post('/items', asyncHandler(async (req, res) => {
  const data: Prisma.ItemCreateInput = itemSchema.parse(req.body);
  const item = await prisma.item.create({ data });
  res.status(201).json(item);
}));

router.put('/items/:id', asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const data: Prisma.ItemUpdateInput = itemSchema.partial().parse(req.body);
  const item = await prisma.item.update({ where: { id }, data });
  res.json(item);
}));

router.post('/cases', asyncHandler(async (req, res) => {
  const data: Prisma.CaseCreateInput = caseSchema.parse(req.body);
  const caseData = await prisma.case.create({ data });
  res.status(201).json(caseData);
}));

router.put('/cases/:id', asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const data: Prisma.CaseUpdateInput = caseSchema.partial().parse(req.body);
  const caseData = await prisma.case.update({ where: { id }, data });
  res.json(caseData);
}));

router.put('/cases/:caseId/items/:itemId', asyncHandler(async (req, res) => {
  const { caseId, itemId } = caseItemParamsSchema.parse(req.params);
  const { chance } = caseItemSchema.parse(req.body);
  const caseItem = await prisma.caseItem.upsert({
    where: { caseId_itemId: { caseId, itemId } },
    update: { chance },
    create: { caseId, itemId, chance }
  });
  res.json(caseItem);
}));

router.post('/users/:id/topup', asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const { amount } = topUpSchema.parse(req.body);
  const user = await prisma.user.update({ where: { id }, data: { balance: { increment: amount } }, select: { id: true, username: true, balance: true } });
  await prisma.history.create({ data: { userId: user.id, type: HistoryType.BALANCE_TOPUP, title: 'Admin balance top-up', metadata: { amount } } });
  res.json(user);
}));

export default router;
