import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';
import { avatarFor } from '../src/utils/social.js';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12);
  const seeds = [
    { email: 'admin@demo.local', username: 'admin', name: 'Администратор', role: Role.ADMIN, bio: 'Слежу за порядком в демо-сообществе.' },
    { email: 'anna@demo.local', username: 'anna', name: 'Анна Смирнова', role: Role.USER, bio: 'Дизайнер, люблю короткие заметки и кофе.' },
    { email: 'ivan@demo.local', username: 'ivan', name: 'Иван Петров', role: Role.USER, bio: 'Разработчик, пишу про продукты и технологии.' }
  ];

  for (const seed of seeds) {
    await prisma.user.upsert({
      where: { email: seed.email },
      update: {},
      create: {
        email: seed.email,
        username: seed.username,
        passwordHash,
        role: seed.role,
        profile: { create: { name: seed.name, bio: seed.bio, city: 'Москва', avatarUrl: avatarFor(seed.name) } }
      }
    });
  }

  const users = await prisma.user.findMany();
  for (const user of users) {
    const exists = await prisma.post.findFirst({ where: { authorId: user.id } });
    if (!exists) {
      await prisma.post.create({ data: { authorId: user.id, content: `Привет! Это первый пост пользователя @${user.username}. Добро пожаловать в Social MVP.` } });
    }
  }
}

main().finally(async () => prisma.$disconnect());
