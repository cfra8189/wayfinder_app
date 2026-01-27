CREATE TABLE `sessions` (
	`sid` text PRIMARY KEY NOT NULL,
	`sess` text NOT NULL,
	`expire` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text,
	`password_hash` text,
	`display_name` text,
	`first_name` text,
	`last_name` text,
	`profile_image_url` text,
	`role` text DEFAULT 'artist',
	`business_name` text,
	`business_bio` text,
	`box_code` text,
	`email_verified` integer DEFAULT false,
	`verification_token` text,
	`verification_token_expires` integer,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `blog_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`shared_content_id` integer,
	`title` text(255) NOT NULL,
	`content` text NOT NULL,
	`author_id` integer NOT NULL,
	`is_published` text DEFAULT 'false',
	`created_at` integer,
	`published_at` integer,
	FOREIGN KEY (`shared_content_id`) REFERENCES `shared_content`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `community_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`shared_content_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`content` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`shared_content_id`) REFERENCES `shared_content`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `community_favorites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`shared_content_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`shared_content_id`) REFERENCES `shared_content`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `creative_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`category` text(50) DEFAULT 'ideas' NOT NULL,
	`title` text(255),
	`content` text NOT NULL,
	`media_urls` text DEFAULT '[]',
	`tags` text DEFAULT '[]',
	`is_pinned` text DEFAULT 'false',
	`sort_order` integer DEFAULT 0,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `press_kits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`short_bio` text,
	`medium_bio` text,
	`long_bio` text,
	`genre` text(100),
	`location` text(255),
	`photo_urls` text DEFAULT '[]',
	`video_urls` text DEFAULT '[]',
	`featured_tracks` text DEFAULT '[]',
	`achievements` text DEFAULT '[]',
	`press_quotes` text DEFAULT '[]',
	`social_links` text DEFAULT '{}',
	`contact_email` text,
	`contact_name` text,
	`booking_email` text,
	`technical_rider` text,
	`stage_plot` text,
	`is_published` integer DEFAULT false,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`title` text(255) NOT NULL,
	`type` text(50) DEFAULT 'single' NOT NULL,
	`status` text(50) DEFAULT 'concept' NOT NULL,
	`description` text,
	`metadata` text DEFAULT '{}',
	`is_featured` integer DEFAULT false,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `shared_content` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`note_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`status` text(20) DEFAULT 'pending' NOT NULL,
	`admin_notes` text,
	`blog_post_id` integer,
	`created_at` integer,
	`approved_at` integer,
	FOREIGN KEY (`note_id`) REFERENCES `creative_notes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `studio_artists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`studio_id` integer NOT NULL,
	`artist_id` integer,
	`status` text(20) DEFAULT 'pending' NOT NULL,
	`invite_email` text,
	`created_at` integer,
	`accepted_at` integer
);
--> statement-breakpoint
CREATE INDEX `IDX_session_expire` ON `sessions` (`expire`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_box_code_unique` ON `users` (`box_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `press_kits_user_id_unique` ON `press_kits` (`user_id`);