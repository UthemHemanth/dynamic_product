import { z } from "zod";
export const createCategorySchema = z.object({
    name: z.string().trim().min(1).max(80),
});
export const createAttributeSchema = z.object({
    name: z.string().trim().min(1).max(80),
    key: z
        .string()
        .trim()
        .min(1)
        .max(60)
        .regex(/^[a-z0-9_]+$/, "key must be snake_case (a-z0-9_)"),
    type: z.enum(["TEXT", "NUMBER", "BOOLEAN", "SELECT"]),
    unit: z.string().trim().min(1).max(20).optional(),
    required: z.boolean().optional().default(false),
    options: z.array(z.string().trim().min(1).max(80)).optional().default([]),
});
