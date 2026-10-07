import { UserRole } from "@prisma/client";

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface LoginResponse {
  user: AuthenticatedUser;
  token: string;
}