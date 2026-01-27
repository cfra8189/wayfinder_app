CREATE TABLE "sessions" (
	"sid" text PRIMARY KEY NOT NULL,
	"sess" text NOT NULL,
	"expire" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" SERIAL PRIMARY KEY,
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
	"email_verified" boolean DEFAULT false,
	"verification_token" text,
	"verification_token_expires" bigint,
	"created_at" timestamptz DEFAULT now(),
	"updated_at" timestamptz DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "creative_notes" (
	"id" SERIAL PRIMARY KEY,
	"user_id" integer NOT NULL,
	"category" text DEFAULT 'ideas' NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"media_urls" jsonb DEFAULT '[]'::jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"is_pinned" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamptz DEFAULT now(),
	"updated_at" timestamptz DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shared_content" (
	"id" SERIAL PRIMARY KEY,
	"note_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"blog_post_id" integer,
	"created_at" timestamptz DEFAULT now(),
	"approved_at" timestamptz,
	FOREIGN KEY ("note_id") REFERENCES "creative_notes"("id")
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" SERIAL PRIMARY KEY,
	"shared_content_id" integer,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"author_id" integer NOT NULL,
	"is_published" boolean DEFAULT false,
	"created_at" timestamptz DEFAULT now(),
	"published_at" timestamptz,
	FOREIGN KEY ("shared_content_id") REFERENCES "shared_content"("id")
);
--> statement-breakpoint
CREATE TABLE "community_comments" (
	"id" SERIAL PRIMARY KEY,
	"shared_content_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamptz DEFAULT now(),
	FOREIGN KEY ("shared_content_id") REFERENCES "shared_content"("id")
);
--> statement-breakpoint
CREATE TABLE "community_favorites" (
	"id" SERIAL PRIMARY KEY,
	"shared_content_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamptz DEFAULT now(),
	FOREIGN KEY ("shared_content_id") REFERENCES "shared_content"("id")
);
--> statement-breakpoint
CREATE TABLE "press_kits" (
	"id" SERIAL PRIMARY KEY,
	"user_id" integer NOT NULL,
	"short_bio" text,
	"medium_bio" text,
	"long_bio" text,
	"genre" text,
	"location" text,
	"photo_urls" jsonb DEFAULT '[]'::jsonb,
	"video_urls" jsonb DEFAULT '[]'::jsonb,
	"featured_tracks" jsonb DEFAULT '[]'::jsonb,
	"achievements" jsonb DEFAULT '[]'::jsonb,
	"press_quotes" jsonb DEFAULT '[]'::jsonb,
	"social_links" jsonb DEFAULT '{}'::jsonb,
	"contact_email" text,
	"contact_name" text,
	"booking_email" text,
	"technical_rider" text,
	"stage_plot" text,
	"is_published" boolean DEFAULT false,
	"created_at" timestamptz DEFAULT now(),
	"updated_at" timestamptz DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" SERIAL PRIMARY KEY,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"type" text DEFAULT 'single' NOT NULL,
	"status" text DEFAULT 'concept' NOT NULL,
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"is_featured" boolean DEFAULT false,
	"created_at" timestamptz DEFAULT now(),
	"updated_at" timestamptz DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "studio_artists" (
	"id" SERIAL PRIMARY KEY,
	"studio_id" integer NOT NULL,
	"artist_id" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"invite_email" text,
	"created_at" timestamptz DEFAULT now(),
	"accepted_at" timestamptz
);
--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" ("expire");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_box_code_unique" ON "users" ("box_code");--> statement-breakpoint
CREATE UNIQUE INDEX "press_kits_user_id_unique" ON "press_kits" ("user_id");