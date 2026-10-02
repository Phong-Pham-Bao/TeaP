import { DocumentSequenceService } from './document-sequence.service';

describe('DocumentSequenceService', () => {
  const service = new DocumentSequenceService();

  it('formats the atomically allocated value with the Vietnam business date', async () => {
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([{ lastValue: 42 }]),
    };

    await expect(
      service.next(tx as never, {
        documentType: 'POS_ORDER',
        prefix: 'ORD',
        branchId: 'branch-a',
        now: new Date('2026-09-29T17:30:00.000Z'),
      }),
    ).resolves.toBe('ORD-260930-000042');
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('fails closed when the database does not return a valid sequence', async () => {
    const tx = { $queryRaw: jest.fn().mockResolvedValue([]) };

    await expect(
      service.next(tx as never, {
        documentType: 'POS_ORDER',
        prefix: 'ORD',
        branchId: 'branch-a',
      }),
    ).rejects.toThrow('invalid value');
  });
});
