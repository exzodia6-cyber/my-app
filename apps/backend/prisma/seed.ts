import bcrypt from 'bcryptjs';
import { PrismaClient, Rarity, ItemWear } from '@prisma/client';
import type { Item } from '@prisma/client';

const prisma = new PrismaClient();
const weapons = ['AK-47','AWP','M4A1-S','M4A4','Desert Eagle','USP-S','Glock-18','P250','Five-SeveN','Galil AR','FAMAS','SSG 08','MAC-10','MP9','P90','Nova','MAG-7','Negev'];
const skins = ['Neon Pulse','Obsidian Grid','Amber Reactor','Crimson Byte','Arctic Circuit','Ghostline','Solar Bloom','Night Protocol','Cyber Fang','Violet Core','Emerald Static','Royal Alloy','Prism Ash','Dragon Glass','Carbon Rush','Fade Signal','Copper Storm','Quantum Mist','Ruby Sync','Ivory Spark'];
const rarities: readonly Rarity[] = [Rarity.CONSUMER_GRADE, Rarity.INDUSTRIAL_GRADE, Rarity.MIL_SPEC, Rarity.RESTRICTED, Rarity.CLASSIFIED, Rarity.COVERT, Rarity.RARE_SPECIAL_ITEM];
const wears: readonly ItemWear[] = [ItemWear.BATTLE_SCARRED, ItemWear.WELL_WORN, ItemWear.FIELD_TESTED, ItemWear.MINIMAL_WEAR, ItemWear.FACTORY_NEW];

function image(seed: string, kind = 'weapon') {
  return `https://placehold.co/640x360/101827/f8fafc?text=${encodeURIComponent(kind === 'case' ? 'CASE ' : '')}${encodeURIComponent(seed)}`;
}

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12);
  await prisma.user.upsert({ where: { email: 'player@example.com' }, update: {}, create: { email: 'player@example.com', username: 'neon_player', passwordHash, balance: 5000 } });
  await prisma.user.upsert({ where: { email: 'admin@example.com' }, update: { role: 'ADMIN' }, create: { email: 'admin@example.com', username: 'arena_admin', passwordHash, role: 'ADMIN', balance: 20000 } });

  const createdItems: Item[] = [];
  for (let i = 0; i < 48; i++) {
    const rarity = rarities[Math.min(rarities.length - 1, Math.floor(i / 7))];
    const price = Math.round((120 + i * 95) * (1 + Math.floor(i / 7) * 0.55));
    const weapon = weapons[i % weapons.length];
    const skin = skins[i % skins.length];
    const item = await prisma.item.upsert({
      where: { id: `seed-item-${i + 1}` },
      update: { weapon, skin, rarity, price, imageUrl: image(`${weapon} ${skin}`), wear: wears[i % wears.length] },
      create: { id: `seed-item-${i + 1}`, weapon, skin, rarity, price, imageUrl: image(`${weapon} ${skin}`), wear: wears[i % wears.length] }
    });
    createdItems.push(item);
  }

  const cases = [
    ['Starter Case', 350, '#22d3ee'], ['Inferno Case', 700, '#fb923c'], ['Mirage Case', 1100, '#a78bfa'], ['Dragon Case', 1800, '#f43f5e'], ['Elite Case', 2600, '#facc15']
  ] as const;
  for (const [index, [name, price, accentColor]] of cases.entries()) {
    const caseData = await prisma.case.upsert({
      where: { name },
      update: { price, accentColor, imageUrl: image(name, 'case') },
      create: { name, price, accentColor, imageUrl: image(name, 'case'), description: `Premium virtual drops for ${name}. No real-money cashout, no Steam trades.` }
    });
    const start = index * 6;
    const pool = createdItems.slice(start, start + 20);
    for (const [poolIndex, item] of pool.entries()) {
      await prisma.caseItem.upsert({
        where: { caseId_itemId: { caseId: caseData.id, itemId: item.id } },
        update: { chance: Math.max(1, 24 - poolIndex * 1.1) },
        create: { caseId: caseData.id, itemId: item.id, chance: Math.max(1, 24 - poolIndex * 1.1) }
      });
    }
  }
  const player = await prisma.user.findUniqueOrThrow({ where: { email: 'player@example.com' } });
  const current = await prisma.inventoryItem.count({ where: { userId: player.id } });
  if (current === 0) {
    await prisma.inventoryItem.createMany({ data: createdItems.slice(0, 12).map((item) => ({ userId: player.id, itemId: item.id })) });
  }
}

main().finally(async () => prisma.$disconnect());
