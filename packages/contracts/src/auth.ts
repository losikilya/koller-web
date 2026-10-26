import { z } from 'zod'
// Supabase local Auth policy: minimum 8 characters, no composition requirement.
export const emailSchema = z.string().trim().toLowerCase().email().max(254)
export const passwordSchema = z.string().min(8).max(128)
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
})
const matchingPasswords = {
  password: passwordSchema,
  confirmPassword: z.string(),
}
export const registrationSchema = z
  .object({ email: emailSchema, ...matchingPasswords })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'passwordMismatch',
  })
export const resetPasswordSchema = z
  .object(matchingPasswords)
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'passwordMismatch',
  })
export const recoverySchema = z.object({ email: emailSchema })
