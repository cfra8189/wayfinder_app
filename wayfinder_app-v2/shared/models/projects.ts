import { integer, pgTable, text, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const projects = pgTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  title: text("title", { length: 255 }).notNull(),
  type: text("type", { length: 50 }).notNull().default("single"),
  status: text("status", { length: 50 }).notNull().default("concept"),
  description: text("description"),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});

export const studioArtists = pgTable("studio_artists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studioId: integer("studio_id").notNull(),
  artistId: integer("artist_id"),
  status: text("status", { length: 20 }).notNull().default("pending"),
  inviteEmail: text("invite_email"),
  createdAt: timestamp("created_at", { withTimezone: true }).$defaultFn(() => new Date()),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
});

export const creativeNotes = pgTable("creative_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  category: text("category", { length: 50 }).notNull().default("ideas"),
  title: text("title", { length: 255 }),
  content: text("content").notNull(),
  mediaUrls: jsonb("media_urls").$type<string[]>().default([]),
  tags: jsonb("tags").$type<string[]>().default([]),
  isPinned: boolean("is_pinned").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});

export const sharedContent = pgTable("shared_content", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  noteId: integer("note_id").notNull().references(() => creativeNotes.id),
  userId: integer("user_id").notNull(),
  status: text("status", { length: 20 }).notNull().default("pending"),
  adminNotes: text("admin_notes"),
  blogPostId: integer("blog_post_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).$defaultFn(() => new Date()),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
});

export const communityFavorites = pgTable("community_favorites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sharedContentId: integer("shared_content_id").notNull().references(() => sharedContent.id),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).$defaultFn(() => new Date()),
});

export const communityComments = pgTable("community_comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sharedContentId: integer("shared_content_id").notNull().references(() => sharedContent.id),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const blogPosts = pgTable("blog_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sharedContentId: integer("shared_content_id").references(() => sharedContent.id),
  title: text("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").notNull(),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).$defaultFn(() => new Date()),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type StudioArtist = typeof studioArtists.$inferSelect;
export type InsertStudioArtist = typeof studioArtists.$inferInsert;
export type CreativeNote = typeof creativeNotes.$inferSelect;
export type InsertCreativeNote = typeof creativeNotes.$inferInsert;
export type SharedContent = typeof sharedContent.$inferSelect;
export type InsertSharedContent = typeof sharedContent.$inferInsert;
export type CommunityFavorite = typeof communityFavorites.$inferSelect;
export type CommunityComment = typeof communityComments.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;

export const pressKits = pgTable("press_kits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().unique(),
  shortBio: text("short_bio"),
  mediumBio: text("medium_bio"),
  longBio: text("long_bio"),
  genre: text("genre", { length: 100 }),
  location: text("location", { length: 255 }),
  photoUrls: jsonb("photo_urls").$type<string[]>().default([]),
  videoUrls: jsonb("video_urls").$type<string[]>().default([]),
  featuredTracks: jsonb("featured_tracks").$type<any[]>().default([]),
  achievements: jsonb("achievements").$type<string[]>().default([]),
  pressQuotes: jsonb("press_quotes").$type<any[]>().default([]),
  socialLinks: jsonb("social_links").$type<Record<string, string>>().default({}),
  contactEmail: text("contact_email"),
  contactName: text("contact_name"),
  bookingEmail: text("booking_email"),
  technicalRider: text("technical_rider"),
  stagePlot: text("stage_plot"),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});

export type PressKit = typeof pressKits.$inferSelect;
export type InsertPressKit = typeof pressKits.$inferInsert;
