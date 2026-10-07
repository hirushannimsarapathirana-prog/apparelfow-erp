import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .email("A valid email address is required"),

    password: z
      .string()
      .min(1, "Password is required"),
  }),

  params: z.object({}),

  query: z.object({}),
});

export type LoginRequest = z.infer<typeof loginSchema>;