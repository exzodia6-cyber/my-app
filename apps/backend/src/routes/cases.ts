import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../utils/errors.js';
import { pickWeighted } from '../utils/game.js';

const router = Router();
const includeCase = { items: { include: { item: true }, orderBy: { chance: 'desc' as const } } } satisfies Prisma.CaseInclude;

router.get('/', asyncHandler(async (_req, res) => {
  const cases = await prisma.case.findMany({ include: includeCase, orderBy: { price: 'asc' } });
  res.json(cases);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const caseData = await prisma.case.findUnique({ where: { id: req.params.id }, include: includeCase });
  if (!caseData) throw new AppError(404, 'Case not found');
  res.json(caseData);
}));

router.post('/:id/open', requireAuth, asyncHandler(async (req, res) => {
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const [caseData, user] = await Promise.all([
      tx.case.findUnique({ where: { id: req.params.id }, include: includeCase }),
      tx.user.findUnique({ where: { id: req.user!.id } })
    ]);
    if (!caseData) throw new AppError(404, 'Case not found');
    if (!caseData.items.length) throw new AppError(400, 'Case has no items');
    if (!user || user.balance < caseData.price) throw new AppError(400, 'Not enough coins');
    const winningEntry = pickWeighted(caseData.items);
    const [updatedUser, inventoryItem] = await Promise.all([
      tx.user.update({ where: { id: user.id }, data: { balance: { decrement: caseData.price } }, select: { balance: true } }),
      tx.inventoryItem.create({ data: { userId: user.id, itemId: winningEntry.itemId }, include: { item: true } })
    ]);
    await tx.history.create({ data: { userId: user.id, type: 'CASE_OPEN', title: `Opened ${caseData.name}`, metadata: { caseId: caseData.id, itemId: winningEntry.itemId, price: caseData.price } } });
    return { inventoryItem, balance: updatedUser.balance, case: caseData };
  });
  res.json(result);
}));

export default router;
