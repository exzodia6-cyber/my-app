import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../utils/errors.js';
import { upgradeChance } from '../utils/game.js';

const router = Router();
router.use(requireAuth);

router.get('/items', asyncHandler(async (_req, res) => {
  const items = await prisma.item.findMany({ orderBy: [{ rarity: 'asc' }, { price: 'asc' }] });
  res.json(items);
}));

router.post('/upgrade', asyncHandler(async (req, res) => {
  const body = z.object({ inventoryItemId: z.string(), targetItemId: z.string() }).parse(req.body);
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const source = await tx.inventoryItem.findFirst({ where: { id: body.inventoryItemId, userId: req.user!.id }, include: { item: true } });
    const target = await tx.item.findUnique({ where: { id: body.targetItemId } });
    if (!source) throw new AppError(404, 'Source item not found');
    if (!target) throw new AppError(404, 'Target item not found');
    const chance = upgradeChance(source.item.price, target.price);
    if (chance <= 0) throw new AppError(400, 'Target item must be more expensive');
    const success = Math.random() < chance;
    await tx.inventoryItem.delete({ where: { id: source.id } });
    const reward = success ? await tx.inventoryItem.create({ data: { userId: req.user!.id, itemId: target.id }, include: { item: true } }) : null;
    await tx.history.create({ data: { userId: req.user!.id, type: success ? 'UPGRADE_SUCCESS' : 'UPGRADE_FAIL', title: success ? 'Upgrade successful' : 'Upgrade failed', metadata: { sourceItemId: source.itemId, targetItemId: target.id, chance, success } } });
    return { success, chance, source, reward };
  });
  res.json(result);
}));

router.post('/contract', asyncHandler(async (req, res) => {
  const body = z.object({ inventoryItemIds: z.array(z.string()).length(10) }).parse(req.body);
  if (new Set(body.inventoryItemIds).size !== 10) throw new AppError(400, 'Choose 10 unique items');
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const sourceItems = await tx.inventoryItem.findMany({ where: { id: { in: body.inventoryItemIds }, userId: req.user!.id }, include: { item: true } });
    if (sourceItems.length !== 10) throw new AppError(400, 'All contract items must belong to you');
    const average = sourceItems.reduce((sum, entry) => sum + entry.item.price, 0) / 10;
    const reward = await tx.item.findFirst({ where: { price: { gte: Math.floor(average), lte: Math.ceil(average * 1.45) } }, orderBy: { price: 'asc' } }) ?? await tx.item.findFirstOrThrow({ orderBy: { price: 'desc' } });
    await tx.inventoryItem.deleteMany({ where: { id: { in: body.inventoryItemIds }, userId: req.user!.id } });
    const inventoryItem = await tx.inventoryItem.create({ data: { userId: req.user!.id, itemId: reward.id }, include: { item: true } });
    await tx.history.create({ data: { userId: req.user!.id, type: 'CONTRACT', title: 'Contract completed', metadata: { sourceIds: body.inventoryItemIds, rewardItemId: reward.id, average } } });
    return { inventoryItem, average };
  });
  res.json(result);
}));

router.get('/history', asyncHandler(async (req, res) => {
  const history = await prisma.history.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, take: 50 });
  res.json(history);
}));

export default router;
