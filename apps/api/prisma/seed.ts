import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.signal.deleteMany();
  await prisma.signal.createMany({
    data: [
      {
        fullName: "Alex Carter",
        location: "Ho Chi Minh City",
        app: "tinder",
        signalType: "Photo overlap",
        status: "Review",
        detail: "Similar photo cluster appears in multiple profiles.",
        confidence: "High",
        score: 72,
      },
      {
        fullName: "Alex Carter",
        location: "Ho Chi Minh City",
        app: "tinder",
        signalType: "Recent activity",
        status: "Active",
        detail: "Activity signal within the last 10 days.",
        confidence: "Medium",
        score: 55,
      },
      {
        fullName: "Jordan Lee",
        location: "Hanoi",
        app: "bumble",
        signalType: "Alias pattern",
        status: "Monitor",
        detail: "Handle variant detected in another city.",
        confidence: "Medium",
        score: 48,
      },
    ],
  });
  console.log("Seeded signals.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
