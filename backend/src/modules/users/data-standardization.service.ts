import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DataStandardizationService {
  private readonly logger = new Logger(DataStandardizationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async standardizeUserData() {
    this.logger.log('Starting user data standardization...');
    
    const users = await this.prisma.user.findMany();
    let updatedCount = 0;

    for (const user of users) {
      const normalizedEmail = user.email.toLowerCase().trim();
      const normalizedPhone = user.phone ? user.phone.replace(/[^\d+]/g, '') : null;
      
      let needsUpdate = false;
      if (user.email !== normalizedEmail) needsUpdate = true;
      if (user.phone !== normalizedPhone) needsUpdate = true;

      if (needsUpdate) {
        try {
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              email: normalizedEmail,
              phone: normalizedPhone,
            },
          });
          updatedCount++;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.error(`Failed to update user ${user.id}: ${message}`);
        }
      }
    }

    this.logger.log(`Finished standardization. Updated ${updatedCount} users.`);
    return { success: true, updatedCount };
  }
}
