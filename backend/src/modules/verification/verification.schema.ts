import { z } from "zod";

const verificationItemSchema = z.object({
  componentId: z.string().uuid(),
  actualQty: z.number().nonnegative(),
});

export const updateVerificationSchema = z.object({
  body: z.object({
    items: z.array(verificationItemSchema).min(1),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}),
});

export const approveVerificationSchema = z.object({
  body: z.object({}),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}),
});

export const rejectVerificationSchema = z.object({
  body: z.object({
    rejectionReason: z.string().trim().min(1),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}),
});