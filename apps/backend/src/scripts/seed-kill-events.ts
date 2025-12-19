import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedKillEvents(userId?: string, count: number = 10) {
  try {
    let user;
    if (userId) {
      user = await prisma.user.findUnique({
        where: { userId },
      });
      if (!user) {
        process.exit(1);
      }
    } else {
      user = await prisma.user.findFirst();
      if (!user) {
        process.exit(1);
      }
    }

    const now = new Date();
    const events = [];

    for (let i = 0; i < count; i++) {
      const daysAgo = Math.floor((i / count) * 30);
      const executionTime = new Date(now);
      executionTime.setDate(executionTime.getDate() - daysAgo);
      executionTime.setHours(
        Math.floor(Math.random() * 24),
        Math.floor(Math.random() * 60),
        Math.floor(Math.random() * 60),
      );

      const triggerMtm = -(Math.random() * 49000 + 1000);
      const triggerLossPercent = Math.random() * 8 + 2;

      events.push({
        userId: user.userId,
        triggerMtm: triggerMtm,
        triggerLossPercent: triggerLossPercent,
        executionTime,
      });
    }

    await prisma.killEvent.createMany({
      data: events,
    });
  } catch (error) {
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const args = process.argv.slice(2);
const userId = args[0];
const count = args[1] ? parseInt(args[1], 10) : 10;

if (count <= 0 || isNaN(count)) {
  process.exit(1);
}

seedKillEvents(userId, count);

