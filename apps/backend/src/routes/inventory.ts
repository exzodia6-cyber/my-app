import { Router } from 'express';
import { HistoryType, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../utils/errors.js';

const router = Router();
router.use(requireAuth);

const itemIdParamSchema = { parse: (params: { itemId?: string }) => {
  if (!params.itemId) throw new AppError(400, 'Inventory item id is required');
  return { itemId: params.itemId };
} };

const inventoryWithItem = Prisma.validator<Prisma.InventoryItemDefaultArgs>()({
  include: { item: true }
});

router.get('/', asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'Authorization token is required');

  const inventory = await prisma.inventoryItem.findMany({ where: { userId }, ...inventoryWithItem, orderBy: { acquiredAt: 'desc' } });
  res.json(inventory);
}));

router.post('/:itemId/sell', asyncHandler(async (req, res) => {
  const { itemId } = itemIdParamSchema.parse(req.params);
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'Authorization token is required');

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const inv = await tx.inventoryItem.findFirst({ where: { id: itemId, userId }, ...inventoryWithItem });
    if (!inv) throw new AppError(404, 'Inventory item not found');

    await tx.inventoryItem.delete({ where: { id: inv.id } });
    const user = await tx.user.update({ where: { id: userId }, data: { balance: { increment: inv.item.price } }, select: { balance: true } });
    await tx.history.create({
      data: {
        userId,
        type: HistoryType.ITEM_SELL,
        title: `Sold ${inv.item.weapon} | ${inv.item.skin}`,
        metadata: { inventoryItemId: inv.id, itemId: inv.itemId, coins: Number(inv.item.price) }
      }
    });
    return { sold: inv, balance: user.balance };
  });
  res.json(result);
}));

export default router;
