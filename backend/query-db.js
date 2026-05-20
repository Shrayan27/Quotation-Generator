const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== DB DIAGNOSTIC ===");
  const sequences = await prisma.followUpSequence.findMany({
    include: {
      quotation: {
        select: {
          quoteNumber: true,
          billName: true,
          total: true
        }
      }
    }
  });

  console.log(`Total sequences found: ${sequences.length}`);
  sequences.forEach((seq) => {
    console.log(`\nID: ${seq.id}`);
    console.log(`Quote Number: ${seq.quotation?.quoteNumber}`);
    console.log(`Customer: ${seq.quotation?.billName}`);
    console.log(`Email: ${seq.customerEmail}`);
    console.log(`Status: ${seq.status}`);
    console.log(`Follow-up Count: ${seq.followUpCount}`);
    console.log(`Next Follow-up Date: ${seq.nextFollowUpDate.toISOString()}`);
    console.log(`Created At: ${seq.createdAt.toISOString()}`);
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
