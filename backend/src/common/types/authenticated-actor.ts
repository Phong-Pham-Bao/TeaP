import { Role } from '@prisma/client';

export interface AuthenticatedActor {
  userId: string;
  email: string;
  role: Role;
  branchId: string | null;
  allowedBranchIds: string[];
  sessionId: string;
}
