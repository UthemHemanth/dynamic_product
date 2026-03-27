import { z } from "zod";

export const productAttributeValueSchema = z.object({
  attributeId: z.string().min(1),
  // value is validated in service using category attribute type for better error messages
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

export const createProductSchema = z.object({
  categoryId: z.string().min(1),
  title: z.string().trim().min(1).max(140),
  description: z.string().trim().max(4000).optional(),
  highlights: z.array(z.string().trim().min(1).max(200)).optional().default([]),
  attributes: z.array(productAttributeValueSchema).optional().default([]),
});

