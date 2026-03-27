import { z } from "zod";
const filterValueSchema = z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.object({ min: z.number().optional(), max: z.number().optional() }),
    z.array(z.union([z.string(), z.number(), z.boolean()])),
]);
export const searchSchema = z.object({
    categoryId: z.string().min(1),
    q: z.string().trim().max(200).optional(),
    filters: z.record(filterValueSchema).optional(),
    page: z.number().int().min(1).optional().default(1),
    pageSize: z.number().int().min(1).max(50).optional().default(20),
});
