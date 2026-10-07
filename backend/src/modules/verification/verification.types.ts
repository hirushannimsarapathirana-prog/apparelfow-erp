import { VerificationStatus } from "@prisma/client";

export interface VerificationItemInput {
  componentId: string;
  actualQty: number;
}

export interface VerificationResultItem {
  componentId: string;
  expectedQty: number;
  actualQty: number | null;
  status: VerificationStatus;
}

export interface VerificationSubmissionInput {
  items: VerificationItemInput[];
}

export interface RejectionInput {
  rejectionReason: string;
}