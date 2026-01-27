CREATE TABLE IF NOT EXISTS "sessions" (
	"sid" text PRIMARY KEY NOT NULL,
	"sess" text NOT NULL,
	"expire" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" integer PRIMARY KEY NOT NULL,
	"email" text,
	"password_hash" text,
	"display_name" text,
	"first_name" text,
	"last_name" text,
	"profile_image_url" text,
	"role" text DEFAULT 'artist',
	"business_name" text,
	"business_bio" text,
	"box_code" text,
	"email_verified" integer DEFAULT false,
	"verification_token" text,
	"verification_token_expires" integer,
	"created_at" integer,
	"updated_at" integer,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_box_code_unique" UNIQUE("box_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blog_posts" (
	"id" integer PRIMARY KEY NOT NULL,
	"shared_content_id" integer,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"author_id" integer NOT NULL,
	"is_published" text DEFAULT 'false',
	"created_at" integer,
	"published_at" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "community_comments" (
	"id" integer PRIMARY KEY NOT NULL,
	"shared_content_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "community_favorites" (
	"id" integer PRIMARY KEY NOT NULL,
	"shared_content_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "creative_notes" (
	"id" integer PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"category" text DEFAULT 'ideas' NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"media_urls" text DEFAULT ,
	"tags" text DEFAULT ,
	"is_pinned" text DEFAULT 'false',
	"sort_order" integer DEFAULT 0,
	"created_at" integer,
	"updated_at" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "press_kits" (
	"id" integer PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"short_bio" text,
	"medium_bio" text,
	"long_bio" text,
	"genre" text,
	"location" text,
	"photo_urls" text DEFAULT ,
	"video_urls" text DEFAULT ,
	"featured_tracks" text DEFAULT ,
	"achievements" text DEFAULT ,
	"press_quotes" text DEFAULT ,
	"social_links" text DEFAULT [object Object],
	"contact_email" text,
	"contact_name" text,
	"booking_email" text,
	"technical_rider" text,
	"stage_plot" text,
	"is_published" integer DEFAULT false,
	"created_at" integer,
	"updated_at" integer,
	CONSTRAINT "press_kits_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projects" (
	"id" integer PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"type" text DEFAULT 'single' NOT NULL,
	"status" text DEFAULT 'concept' NOT NULL,
	"description" text,
	"metadata" text DEFAULT [object Object],
	"is_featured" integer DEFAULT false,
	"created_at" integer,
	"updated_at" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shared_content" (
	"id" integer PRIMARY KEY NOT NULL,
	"note_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"blog_post_id" integer,
	"created_at" integer,
	"approved_at" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "studio_artists" (
	"id" integer PRIMARY KEY NOT NULL,
	"studio_id" integer NOT NULL,
	"artist_id" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"invite_email" text,
	"created_at" integer,
	"accepted_at" integer
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_shared_content_id_shared_content_id_fk" FOREIGN KEY ("shared_content_id") REFERENCES "public"."shared_content"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_shared_content_id_shared_content_id_fk" FOREIGN KEY ("shared_content_id") REFERENCES "public"."shared_content"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "community_favorites" ADD CONSTRAINT "community_favorites_shared_content_id_shared_content_id_fk" FOREIGN KEY ("shared_content_id") REFERENCES "public"."shared_content"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shared_content" ADD CONSTRAINT "shared_content_note_id_creative_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."creative_notes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" USING btree ("expire");