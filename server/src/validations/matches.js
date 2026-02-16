// src/validation/matches.js
import { z } from "zod";

export const MATCH_STATUS = {
  SCHEDULED: "scheduled",
  LIVE: "live",
  FINISHED: "finished",
};

const isoDateString = z.string().refine(
  (value) => {
    const ms = Date.parse(value);
    return Number.isFinite(ms) && new Date(ms).toISOString() === value;
  },
  { message: "Must be a valid ISO date string" }
);

export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});


export const createMatchSchema = z
  .object({
    sport: z.string().min(1, "sport is required"),
    homeTeam: z.string().min(1, "homeTeam is required"),
    awayTeam: z.string().min(1, "awayTeam is required"),

    startTime: isoDateString,
    endTime: isoDateString,

    homeScore: z.coerce.number().int().min(0).optional(),
    awayScore: z.coerce.number().int().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    const start = Date.parse(data.startTime);
    const end = Date.parse(data.endTime);

    // isoDateString already validates parse-ability, but keep this safe.
    if (!Number.isFinite(start) || !Number.isFinite(end)) return;

    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "endTime must be after startTime",
      });
    }
  });

export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().min(0),
  awayScore: z.coerce.number().int().min(0),
});
