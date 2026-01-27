"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pressKits = exports.blogPosts = exports.communityComments = exports.communityFavorites = exports.sharedContent = exports.creativeNotes = exports.studioArtists = exports.projects = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.projects = (0, pg_core_1.pgTable)("projects", {
    id: (0, pg_core_1.integer)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull(),
    title: (0, pg_core_1.text)("title").notNull(),
    type: (0, pg_core_1.text)("type").notNull().default("single"),
    status: (0, pg_core_1.text)("status").notNull().default("concept"),
    description: (0, pg_core_1.text)("description"),
    metadata: (0, pg_core_1.jsonb)("metadata").$type(),
    isFeatured: (0, pg_core_1.boolean)("is_featured").default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at").$defaultFn(() => new Date()),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});
exports.studioArtists = (0, pg_core_1.pgTable)("studio_artists", {
    id: (0, pg_core_1.integer)("id").primaryKey(),
    studioId: (0, pg_core_1.integer)("studio_id").notNull(),
    artistId: (0, pg_core_1.integer)("artist_id"),
    status: (0, pg_core_1.text)("status").notNull().default("pending"),
    inviteEmail: (0, pg_core_1.text)("invite_email"),
    createdAt: (0, pg_core_1.timestamp)("created_at").$defaultFn(() => new Date()),
    acceptedAt: (0, pg_core_1.timestamp)("accepted_at"),
});
exports.creativeNotes = (0, pg_core_1.pgTable)("creative_notes", {
    id: (0, pg_core_1.integer)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull(),
    category: (0, pg_core_1.text)("category").notNull().default("ideas"),
    title: (0, pg_core_1.text)("title"),
    content: (0, pg_core_1.text)("content").notNull(),
    mediaUrls: (0, pg_core_1.jsonb)("media_urls").$type(),
    tags: (0, pg_core_1.jsonb)("tags").$type(),
    isPinned: (0, pg_core_1.boolean)("is_pinned").default(false),
    sortOrder: (0, pg_core_1.integer)("sort_order").default(0),
    createdAt: (0, pg_core_1.timestamp)("created_at").$defaultFn(() => new Date()),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});
exports.sharedContent = (0, pg_core_1.pgTable)("shared_content", {
    id: (0, pg_core_1.integer)("id").primaryKey(),
    noteId: (0, pg_core_1.integer)("note_id").notNull().references(() => exports.creativeNotes.id),
    userId: (0, pg_core_1.integer)("user_id").notNull(),
    status: (0, pg_core_1.text)("status").notNull().default("pending"),
    adminNotes: (0, pg_core_1.text)("admin_notes"),
    blogPostId: (0, pg_core_1.integer)("blog_post_id"),
    createdAt: (0, pg_core_1.timestamp)("created_at").$defaultFn(() => new Date()),
    approvedAt: (0, pg_core_1.timestamp)("approved_at"),
});
exports.communityFavorites = (0, pg_core_1.pgTable)("community_favorites", {
    id: (0, pg_core_1.integer)("id").primaryKey(),
    sharedContentId: (0, pg_core_1.integer)("shared_content_id").notNull().references(() => exports.sharedContent.id),
    userId: (0, pg_core_1.integer)("user_id").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").$defaultFn(() => new Date()),
});
exports.communityComments = (0, pg_core_1.pgTable)("community_comments", {
    id: (0, pg_core_1.integer)("id").primaryKey(),
    sharedContentId: (0, pg_core_1.integer)("shared_content_id").notNull().references(() => exports.sharedContent.id),
    userId: (0, pg_core_1.integer)("user_id").notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").$defaultFn(() => new Date()),
});
exports.blogPosts = (0, pg_core_1.pgTable)("blog_posts", {
    id: (0, pg_core_1.integer)("id").primaryKey(),
    sharedContentId: (0, pg_core_1.integer)("shared_content_id").references(() => exports.sharedContent.id),
    title: (0, pg_core_1.text)("title").notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    authorId: (0, pg_core_1.integer)("author_id").notNull(),
    isPublished: (0, pg_core_1.boolean)("is_published").default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at").$defaultFn(() => new Date()),
    publishedAt: (0, pg_core_1.timestamp)("published_at"),
});
exports.pressKits = (0, pg_core_1.pgTable)("press_kits", {
    id: (0, pg_core_1.integer)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull().unique(),
    shortBio: (0, pg_core_1.text)("short_bio"),
    mediumBio: (0, pg_core_1.text)("medium_bio"),
    longBio: (0, pg_core_1.text)("long_bio"),
    genre: (0, pg_core_1.text)("genre"),
    location: (0, pg_core_1.text)("location"),
    photoUrls: (0, pg_core_1.jsonb)("photo_urls").$type(),
    videoUrls: (0, pg_core_1.jsonb)("video_urls").$type(),
    featuredTracks: (0, pg_core_1.jsonb)("featured_tracks").$type(),
    achievements: (0, pg_core_1.jsonb)("achievements").$type(),
    pressQuotes: (0, pg_core_1.jsonb)("press_quotes").$type(),
    socialLinks: (0, pg_core_1.jsonb)("social_links").$type(),
    contactEmail: (0, pg_core_1.text)("contact_email"),
    contactName: (0, pg_core_1.text)("contact_name"),
    bookingEmail: (0, pg_core_1.text)("booking_email"),
    technicalRider: (0, pg_core_1.text)("technical_rider"),
    stagePlot: (0, pg_core_1.text)("stage_plot"),
    isPublished: (0, pg_core_1.boolean)("is_published").default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at").$defaultFn(() => new Date()),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});
