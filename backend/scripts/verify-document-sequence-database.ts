import './assert-test-database';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { DocumentSequenceService } from '../src/modules/platform/document-sequence.service';

const prisma = new PrismaClient();
const sequenceService = new DocumentSequenceService();

async function main() {
  const branchIds = [randomUUID(), randomUUID()];
  const now = new Date('2026-09-29T10:00:00.000Z');

  try {
    await prisma.branch.createMany({
      data: branchIds.map((id, index) => ({
        id,
        name: `Sequence test branch ${index + 1}`,
        address: 'Test only',
      })),
    });

    const numbers = await Promise.all(
      Array.from({ length: 24 }, () =>
        prisma.$transaction((tx) =>
          sequenceService.next(tx, {
            documentType: 'POS_ORDER',
            prefix: 'ORD',
            branchId: branchIds[0],
            now,
          }),
        ),
      ),
    );

    if (new Set(numbers).size !== numbers.length) {
      throw new Error('Concurrent allocation produced duplicate numbers');
    }
    const values = numbers
      .map((value) => Number(value.slice(value.lastIndexOf('-') + 1)))
      .sort((left, right) => left - right);
    if (values.some((value, index) => value !== index + 1)) {
      throw new Error('Concurrent allocation produced a gap or invalid value');
    }

    const secondBranchNumber = await prisma.$transaction((tx) =>
      sequenceService.next(tx, {
        documentType: 'POS_ORDER',
        prefix: 'ORD',
        branchId: branchIds[1],
        now,
      }),
    );
    if (!secondBranchNumber.endsWith('-000001')) {
      throw new Error('Sequence did not restart inside the second branch scope');
    }

    console.log(
      'Document sequence database verification passed: 24 concurrent unique allocations and independent branch scope',
    );
  } finally {
    await prisma.documentSequence.deleteMany({
      where: { branchId: { in: branchIds } },
    });
    await prisma.branch.deleteMany({ where: { id: { in: branchIds } } });
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
