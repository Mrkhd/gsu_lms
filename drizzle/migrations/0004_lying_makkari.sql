CREATE TABLE `form_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`form_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`answers` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `form_submissions_form_id_idx` ON `form_submissions` (`form_id`);--> statement-breakpoint
CREATE TABLE `forms` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`fields` text DEFAULT '[]' NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `forms_slug_key` ON `forms` (`slug`);--> statement-breakpoint
CREATE INDEX `forms_status_idx` ON `forms` (`status`);