import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Songs table - stores worship songs with chords and lyrics
export const songs = pgTable("songs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  artist: text("artist"),
  originalKey: text("original_key").notNull(), // e.g., "C", "G", "Am", "D#"
  lyrics: text("lyrics").notNull(), // Multi-line format: chord line followed by lyric line
  tags: text("tags").array(), // e.g., ["worship", "praise", "fast"]
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Musicians table - band members and worship team
export const musicians = pgTable("musicians", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  instrument: text("instrument"), // e.g., "Guitar", "Piano", "Vocals"
  contact: text("contact"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Song leaders table
export const songLeaders = pgTable("song_leaders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  contact: text("contact"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Setlists table - collections of songs for services
export const setlists = pgTable("setlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  date: timestamp("date").notNull(),
  songLeaderId: varchar("song_leader_id").references(() => songLeaders.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Setlist songs junction table - songs in a setlist with ordering
export const setlistSongs = pgTable("setlist_songs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  setlistId: varchar("setlist_id").notNull().references(() => setlists.id, { onDelete: "cascade" }),
  songId: varchar("song_id").notNull().references(() => songs.id, { onDelete: "cascade" }),
  order: integer("order").notNull(), // Position in setlist
  transposedKey: text("transposed_key"), // If different from original
});

// Setlist musicians junction table - musicians assigned to a setlist
export const setlistMusicians = pgTable("setlist_musicians", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  setlistId: varchar("setlist_id").notNull().references(() => setlists.id, { onDelete: "cascade" }),
  musicianId: varchar("musician_id").notNull().references(() => musicians.id, { onDelete: "cascade" }),
});

// Song usage tracking - when and how often songs are used
export const songUsage = pgTable("song_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  songId: varchar("song_id").notNull().references(() => songs.id, { onDelete: "cascade" }),
  setlistId: varchar("setlist_id").notNull().references(() => setlists.id, { onDelete: "cascade" }),
  usedAt: timestamp("used_at").notNull(),
});

// Insert schemas
export const insertSongSchema = createInsertSchema(songs).omit({
  id: true,
  createdAt: true,
});

export const insertMusicianSchema = createInsertSchema(musicians).omit({
  id: true,
  createdAt: true,
});

export const insertSongLeaderSchema = createInsertSchema(songLeaders).omit({
  id: true,
  createdAt: true,
});

export const insertSetlistSchema = createInsertSchema(setlists).omit({
  id: true,
  createdAt: true,
});

export const insertSetlistSongSchema = createInsertSchema(setlistSongs).omit({
  id: true,
});

export const insertSetlistMusicianSchema = createInsertSchema(setlistMusicians).omit({
  id: true,
});

export const insertSongUsageSchema = createInsertSchema(songUsage).omit({
  id: true,
});

// Types
export type Song = typeof songs.$inferSelect;
export type InsertSong = z.infer<typeof insertSongSchema>;

export type Musician = typeof musicians.$inferSelect;
export type InsertMusician = z.infer<typeof insertMusicianSchema>;

export type SongLeader = typeof songLeaders.$inferSelect;
export type InsertSongLeader = z.infer<typeof insertSongLeaderSchema>;

export type Setlist = typeof setlists.$inferSelect;
export type InsertSetlist = z.infer<typeof insertSetlistSchema>;

export type SetlistSong = typeof setlistSongs.$inferSelect;
export type InsertSetlistSong = z.infer<typeof insertSetlistSongSchema>;

export type SetlistMusician = typeof setlistMusicians.$inferSelect;
export type InsertSetlistMusician = z.infer<typeof insertSetlistMusicianSchema>;

export type SongUsage = typeof songUsage.$inferSelect;
export type InsertSongUsage = z.infer<typeof insertSongUsageSchema>;

// Extended types for API responses
export type SetlistWithDetails = Setlist & {
  songLeader?: SongLeader;
  songs: Array<SetlistSong & { song: Song }>;
  musicians: Array<SetlistMusician & { musician: Musician }>;
};

export type SongWithUsage = Song & {
  usageCount: number;
  lastUsed?: Date;
};
