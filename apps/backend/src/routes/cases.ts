import { Router } from 'express';
import { HistoryType, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../utils/errors.js';
import { pickWeighted } from '../utils/game.js';

const router = Router();
const idParamSchema = { parse: (params: { id?: string }) => {
  if (!params.id) throw new AppError(400, 'Case id is required');
  return { id: params.id };
} };
const caseWithItems = Prisma.validator<Prisma.CaseDefaultArgs>()({
  include: { items: { include: { item: true }, orderBy: { chance: 'desc' } } }
});

router.get('/', asyncHandler(async (_req, res) => {
  const cases = await prisma.case.findMany({ ...caseWithItems, orderBy: { price: 'asc' } });
  res.json(cases);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const caseData = await prisma.case.findUnique({ where: { id }, ...caseWithItems });
  if (!caseData) throw new AppError(404, 'Case not found');
  res.json(caseData);
}));

router.post('/:id/open', requireAuth, asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'Authorization token is required');

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const [caseData, user] = await Promise.all([
      tx.case.findUnique({ where: { id }, ...caseWithItems }),
      tx.user.findUnique({ where: { id: userId } })
    ]);
    if (!caseData) throw new AppError(404, 'Case not found');
    if (!caseData.items.length) throw new AppError(400, 'Case has no items');
    if (!user || Number(user.balance) < Number(caseData.price)) throw new AppError(400, 'Not enough coins');

    const winningEntry = pickWeighted(caseData.items);
    const [updatedUser, inventoryItem] = await Promise.all([
      tx.user.update({ where: { id: user.id }, data: { balance: { decrement: caseData.price } }, select: { balance: true } }),
      tx.inventoryItem.create({ data: { userId: user.id, itemId: winningEntry.itemId }, include: { item: true } })
    ]);
    await tx.history.create({
      data: {
        userId: user.id,
        type: HistoryType.CASE_OPEN,
        title: `Opened ${caseData.name}`,
        metadata: { caseId: caseData.id, itemId: winningEntry.itemId, price: Number(caseData.price) }
      }
    });
    return { inventoryItem, balance: updatedUser.balance, case: caseData };
  });
  res.json(result);
}));

export default router;
