import { z } from "zod";

export const listCommentaryQuerySchema = z.object({
    limit: z.coerce.number().positive().max(100).optional(),
});


export const createCommentarySchema = z.object({
    minute: z.number().int().nonnegative(),
    sequence: z.number().int().nonnegative().optional(),
    period: z.string().min(1),
    eventType: z.string().min(1).optional(),
    actor: z.string().min(1).optional(),
    team: z.string().min(1).optional(),
    message: z.string().min(1),
    metadata: z.record(z.string(), z.unknown()).optional(),

    tags: z.array(z.string().min(1)).optional(),
});