import { UserRole } from "@prisma/client";

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}