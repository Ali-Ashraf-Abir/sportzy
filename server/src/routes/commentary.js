import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { createCommentarySchema, listCommentaryQuerySchema } from "../validations/commentary.js";
import { matchIdParamSchema } from "../validations/matches.js";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";

export const commentaryRouter = Router();
const MAX_LIMIT = 50;
commentaryRouter.get("/:id", async (req, res) => {
    try {
        // 1) Validate params + query
        const { id: matchId } = matchIdParamSchema.parse(req.params);
        const { limit } = listCommentaryQuerySchema.parse(req.query);

        // 4) Apply safe limit
        const safeLimit = Math.min(limit ?? MAX_LIMIT, MAX_LIMIT);

        // 2,3,4) Fetch commentary
        const rows = await db
            .select()
            .from(commentary)
            .where(eq(commentary.matchId, matchId))
            .orderBy(desc(commentary.createdAt))
            .limit(safeLimit);

        return res.json(rows);

    } catch (err) {
        console.error("GET /commentary error:", err);

        if (err?.name === "ZodError") {
            return res.status(400).json({
                error: "ValidationError",
                issues: err.issues,
            });
        }

        return res.status(500).json({
            error: "InternalServerError",
            message: "Failed to fetch commentary",
        });
    }
});

commentaryRouter.post("/:id", async (req, res) => {
    console.log("req.params:", req.params);
    console.log("schemas", {
        matchIdParamSchema: typeof matchIdParamSchema,
        createCommentarySchema: typeof createCommentarySchema,
    });

    try {
        const { id: matchId } = matchIdParamSchema.parse(req.params);
        const payload = createCommentarySchema.parse(req.body);


        const [created] = await db
            .insert(commentary)
            .values({
                matchId,
                minute: payload.minute,
                sequence: payload.sequence ?? null,
                period: payload.period,
                eventType: payload.eventType ?? null,
                actor: payload.actor ?? null,
                team: payload.team ?? null,
                message: payload.message,
                metadata: payload.metadata ?? {},
                tags: payload.tags ?? [],
            })
            .returning();

        if (res.app.locals.broadcastCommentary) {
            res.app.locals.broadcastCommentary(created);
        }

        return res.status(201).json(created);
    } catch (err) {
        console.error("POST /commentary error:", err);

        if (err?.name === "ZodError") {
            return res.status(400).json({
                error: "ValidationError",
                issues: err.issues,
            });
        }

        return res.status(500).json({
            error: "InternalServerError",
            message: "Failed to create commentary",
        });
    }
});
