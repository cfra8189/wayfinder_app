ALTER TABLE "sessions" ALTER COLUMN "sess" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email_verified" SET DATA TYPE boolean;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "blog_posts" ALTER COLUMN "is_published" SET DATA TYPE boolean;--> statement-breakpoint
ALTER TABLE "blog_posts" ALTER COLUMN "is_published" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "blog_posts" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "blog_posts" ALTER COLUMN "published_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "community_favorites" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "creative_notes" ALTER COLUMN "media_urls" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "creative_notes" ALTER COLUMN "media_urls" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "creative_notes" ALTER COLUMN "tags" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "creative_notes" ALTER COLUMN "tags" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "creative_notes" ALTER COLUMN "is_pinned" SET DATA TYPE boolean;--> statement-breakpoint
ALTER TABLE "creative_notes" ALTER COLUMN "is_pinned" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "creative_notes" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "press_kits" ALTER COLUMN "photo_urls" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "press_kits" ALTER COLUMN "photo_urls" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "press_kits" ALTER COLUMN "video_urls" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "press_kits" ALTER COLUMN "video_urls" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "press_kits" ALTER COLUMN "featured_tracks" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "press_kits" ALTER COLUMN "featured_tracks" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "press_kits" ALTER COLUMN "achievements" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "press_kits" ALTER COLUMN "achievements" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "press_kits" ALTER COLUMN "press_quotes" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "press_kits" ALTER COLUMN "press_quotes" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "press_kits" ALTER COLUMN "social_links" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "press_kits" ALTER COLUMN "social_links" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "press_kits" ALTER COLUMN "is_published" SET DATA TYPE boolean;--> statement-breakpoint
ALTER TABLE "press_kits" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "press_kits" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "metadata" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "metadata" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "is_featured" SET DATA TYPE boolean;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "shared_content" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "shared_content" ALTER COLUMN "approved_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "studio_artists" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "studio_artists" ALTER COLUMN "accepted_at" SET DATA TYPE timestamp with time zone;