import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../utils/errors.js';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const inventory = await prisma.inventoryItem.findMany({ where: { userId: req.user!.id }, include: { item: true }, orderBy: { acquiredAt: 'desc' } });
  res.json(inventory);
}));

router.post('/:itemId/sell', asyncHandler(async (req, res) => {
  const result = await prisma.$transaction(async (tx) => {
    const inv = await tx.inventoryItem.findFirst({ where: { id: req.params.itemId, userId: req.user!.id }, include: { item: true } });
    if (!inv) throw new AppError(404, 'Inventory item not found');
    await tx.inventoryItem.delete({ where: { id: inv.id } });
    const user = await tx.user.update({ where: { id: req.user!.id }, data: { balance: { increment: inv.item.price } }, select: { balance: true } });
    await tx.history.create({ data: { userId: req.user!.id, type: 'ITEM_SELL', title: `Sold ${inv.item.weapon} | ${inv.item.skin}`, metadata: { inventoryItemId: inv.id, itemId: inv.itemId, coins: inv.item.price } } });
    return { sold: inv, balance: user.balance };
  });
  res.json(result);
}));

export default router;
