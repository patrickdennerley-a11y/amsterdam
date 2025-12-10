import { z } from "zod";

// Email must be UniMelb student email
export const uniMelbEmailSchema = z
  .string()
  .email("Please enter a valid email address")
  .regex(
    /^[a-zA-Z0-9._%+-]+@student\.unimelb\.edu\.au$/,
    "Must be a valid @student.unimelb.edu.au email"
  );

export const signupSchema = z.object({
  email: uniMelbEmailSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

export const loginSchema = z.object({
  email: uniMelbEmailSchema,
  password: z.string().min(1, "Password is required"),
});

export const onboardingSchema = z.object({
  full_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  major: z
    .string()
    .min(2, "Major must be at least 2 characters")
    .max(100, "Major must be less than 100 characters"),
  bio: z
    .string()
    .min(50, "Bio must be at least 50 characters")
    .max(500, "Bio must be less than 500 characters"),
});

export const messageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(1000, "Message must be less than 1000 characters"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
