import type { Prisma, User } from '@prisma/client';

export const avatarFor = (seed: string) => `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`;

export const publicUserSelect = {
  id: true,
  email: true,
  username: true,
  role: true,
  createdAt: true,
  profile: true,
  _count: { select: { followers: true, following: true, posts: true } }
} satisfies Prisma.UserSelect;

export function signUser(user: Pick<User, 'id' | 'role'>) {
  return { id: user.id, role: user.role };
}
