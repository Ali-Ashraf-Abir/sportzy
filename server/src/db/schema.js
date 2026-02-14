// src/db/schema.js
import {
  pgEnum,
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  jsonb,
  varchar,
} from "drizzle-orm/pg-core";

// --- ENUMS ---------------------------------------------------------------

export const matchStatusEnum = pgEnum("match_status", [
  "scheduled",
  "live",
  "finished",
]);

// --- TABLES --------------------------------------------------------------

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),

  sport: text("sport").notNull(),

  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),

  status: matchStatusEnum("status").notNull().default("scheduled"),

  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }),

  homeScore: integer("home_score").notNull().default(0),
  awayScore: integer("away_score").notNull().default(0),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const commentary = pgTable("commentary", {
  id: serial("id").primaryKey(),

  matchId: integer("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),

  // For real-time feeds: sort by (minute, sequence)
  minute: integer("minute").notNull(),
  sequence: integer("sequence").notNull().default(0),

  // e.g. "1H", "2H", "OT", "PEN", "Q1", "Q2", etc.
  period: varchar("period", { length: 16 }).notNull().default("1H"),

  // e.g. "goal", "foul", "substitution", "timeout", "kickoff"
  eventType: text("event_type").notNull(),

  // Actor could be player name, referee, system, etc.
  actor: text("actor"),

  // Team label (usually matches.homeTeam or matches.awayTeam, but kept flexible)
  team: text("team"),

  message: text("message").notNull(),

  // Arbitrary structured payload from your feed provider
  metadata: jsonb("metadata").notNull().default({}),

  // Lightweight search/filter helpers
  tags: text("tags").array().notNull().default([]),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
