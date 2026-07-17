import { z } from "zod";

// Password rules:
// - Minimum 8 characters
// - At least one uppercase letter
// - At least one lowercase letter
// - At least one number
// - At least one special character
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

export const signupSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const clientSchema = z.object({
  name: z.string().min(2, "Client name must be at least 2 characters"),
  contactName: z.string().min(2, "Contact name must be at least 2 characters"),
  contactEmail: z.string().email("Invalid contact email address"),
  contactPhone: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .regex(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/, "Invalid phone number format"),
  website: z.string().refine((val) => {
    // Standard URL check that allows simple addresses like test.com or with protocols
    try {
      const withProtocol = val.includes("://") ? val : `https://${val}`;
      new URL(withProtocol);
      return true;
    } catch {
      return false;
    }
  }, "Invalid website URL format (e.g. example.com or https://example.com)"),
  notes: z.string().default(""),
  industry: z.string().min(2, "Industry must be at least 2 characters"),
  competitors: z.string().default(""),
});

export const campaignSchema = z.object({
  name: z.string().min(2, "Campaign name must be at least 2 characters"),
  platform: z.enum(["instagram", "twitter", "linkedin", "reddit"]),
  platformClientId: z.string().min(3, "Platform Client ID must be at least 3 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  status: z.enum(["active", "paused", "completed"]).default("active"),
});

export const reportSchema = z.object({
  name: z.string().min(2, "Report name must be at least 2 characters"),
  clientId: z.string().min(1, "Client is required"),
  campaignId: z.string().min(1, "Campaign is required"),
  platform: z.enum(["instagram", "twitter", "linkedin", "reddit"]),
  dateRange: z.object({
    start: z.string().min(1, "Start date is required"),
    end: z.string().min(1, "End date is required"),
  }),
});
