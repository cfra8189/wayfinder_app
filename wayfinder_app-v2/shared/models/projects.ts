import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./auth";

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  title: text("title", { length: 255 }).notNull(),
  type: text("type", { length: 50 }).notNull().default("single"),
  status: text("status", { length: 50 }).notNull().default("concept"),
  description: text("description"),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, any>>().default({}),
  isFeatured: integer("is_featured", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});

export const studioArtists = sqliteTable("studio_artists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studioId: integer("studio_id").notNull(),
  artistId: integer("artist_id"),
  status: text("status", { length: 20 }).notNull().default("pending"),
  inviteEmail: text("invite_email"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  acceptedAt: integer("accepted_at", { mode: "timestamp" }),
});

export const creativeNotes = sqliteTable("creative_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  category: text("category", { length: 50 }).notNull().default("ideas"),
  title: text("title", { length: 255 }),
  content: text("content").notNull(),
  mediaUrls: text("media_urls", { mode: "json" }).$type<string[]>().default([]),
  tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
  isPinned: text("is_pinned").default("false"), // Kept as text per original schema which had varchar default "false" but named is_pinned? Wait, original had isPinned varchar? Let's check. Original: isPinned: varchar("is_pinned").default("false"). Okay keeping as text.
  sortOrder: integer("sort_order").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});

export const sharedContent = sqliteTable("shared_content", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  noteId: integer("note_id").notNull().references(() => creativeNotes.id),
  userId: integer("user_id").notNull(),
  status: text("status", { length: 20 }).notNull().default("pending"),
  adminNotes: text("admin_notes"),
  blogPostId: integer("blog_post_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
});

export const communityFavorites = sqliteTable("community_favorites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sharedContentId: integer("shared_content_id").notNull().references(() => sharedContent.id),
  userId: integer("user_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const communityComments = sqliteTable("community_comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sharedContentId: integer("shared_content_id").notNull().references(() => sharedContent.id),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const blogPosts = sqliteTable("blog_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sharedContentId: integer("shared_content_id").references(() => sharedContent.id),
  title: text("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").notNull(),
  isPublished: text("is_published").default("false"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  publishedAt: integer("published_at", { mode: "timestamp" }),
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

export const pressKits = sqliteTable("press_kits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().unique(),
  shortBio: text("short_bio"),
  mediumBio: text("medium_bio"),
  longBio: text("long_bio"),
  genre: text("genre", { length: 100 }),
  location: text("location", { length: 255 }),
  photoUrls: text("photo_urls", { mode: "json" }).$type<string[]>().default([]),
  videoUrls: text("video_urls", { mode: "json" }).$type<string[]>().default([]),
  featuredTracks: text("featured_tracks", { mode: "json" }).$type<any[]>().default([]),
  achievements: text("achievements", { mode: "json" }).$type<string[]>().default([]),
  pressQuotes: text("press_quotes", { mode: "json" }).$type<any[]>().default([]),
  socialLinks: text("social_links", { mode: "json" }).$type<Record<string, string>>().default({}),
  contactEmail: text("contact_email"),
  contactName: text("contact_name"),
  bookingEmail: text("booking_email"),
  technicalRider: text("technical_rider"),
  stagePlot: text("stage_plot"),
  isPublished: integer("is_published", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});

export type PressKit = typeof pressKits.$inferSelect;
export type InsertPressKit = typeof pressKits.$inferInsert;
