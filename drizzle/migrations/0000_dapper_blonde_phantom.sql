CREATE TABLE `bundle_courses` (
	`id` text PRIMARY KEY NOT NULL,
	`bundle_id` text NOT NULL,
	`course_id` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`bundle_id`) REFERENCES `bundles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bundle_courses_bundle_id_course_id_key` ON `bundle_courses` (`bundle_id`,`course_id`);--> statement-breakpoint
CREATE TABLE `bundle_enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`bundle_id` text NOT NULL,
	`source` text DEFAULT 'BUNDLE_PURCHASE' NOT NULL,
	`source_id` text,
	`started_at` integer NOT NULL,
	`expires_at` integer,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`bundle_id`) REFERENCES `bundles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bundle_enrollments_student_id_bundle_id_key` ON `bundle_enrollments` (`student_id`,`bundle_id`);--> statement-breakpoint
CREATE INDEX `bundle_enrollments_student_id_idx` ON `bundle_enrollments` (`student_id`);--> statement-breakpoint
CREATE INDEX `bundle_enrollments_bundle_id_idx` ON `bundle_enrollments` (`bundle_id`);--> statement-breakpoint
CREATE TABLE `bundles` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`short_description` text,
	`description` text,
	`thumbnail_url` text,
	`price` real DEFAULT 0 NOT NULL,
	`access_duration_days` integer,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bundles_slug_key` ON `bundles` (`slug`);--> statement-breakpoint
CREATE INDEX `bundles_status_idx` ON `bundles` (`status`);--> statement-breakpoint
CREATE TABLE `course_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `course_categories_slug_key` ON `course_categories` (`slug`);--> statement-breakpoint
CREATE TABLE `course_sections` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`title` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `course_sections_course_id_position_idx` ON `course_sections` (`course_id`,`position`);--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`short_description` text,
	`description` text,
	`thumbnail_url` text,
	`level` text DEFAULT 'BEGINNER' NOT NULL,
	`price` real DEFAULT 0 NOT NULL,
	`access_duration_days` integer,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`what_you_learn` text DEFAULT '[]' NOT NULL,
	`requirements` text DEFAULT '[]' NOT NULL,
	`category_id` text,
	`instructor_id` text NOT NULL,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `course_categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`instructor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `courses_slug_key` ON `courses` (`slug`);--> statement-breakpoint
CREATE INDEX `courses_status_idx` ON `courses` (`status`);--> statement-breakpoint
CREATE INDEX `courses_category_id_idx` ON `courses` (`category_id`);--> statement-breakpoint
CREATE INDEX `courses_instructor_id_idx` ON `courses` (`instructor_id`);--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`course_id` text NOT NULL,
	`bundle_id` text,
	`source` text DEFAULT 'DIRECT_PURCHASE' NOT NULL,
	`source_id` text,
	`started_at` integer NOT NULL,
	`expires_at` integer,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `enrollments_student_id_course_id_key` ON `enrollments` (`student_id`,`course_id`);--> statement-breakpoint
CREATE INDEX `enrollments_student_id_idx` ON `enrollments` (`student_id`);--> statement-breakpoint
CREATE INDEX `enrollments_course_id_idx` ON `enrollments` (`course_id`);--> statement-breakpoint
CREATE INDEX `enrollments_expires_at_idx` ON `enrollments` (`expires_at`);--> statement-breakpoint
CREATE INDEX `enrollments_status_idx` ON `enrollments` (`status`);--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`course_id` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`completed_at` integer,
	`last_viewed_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_progress_student_id_lesson_id_key` ON `lesson_progress` (`student_id`,`lesson_id`);--> statement-breakpoint
CREATE INDEX `lesson_progress_student_id_course_id_idx` ON `lesson_progress` (`student_id`,`course_id`);--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`section_id` text NOT NULL,
	`title` text NOT NULL,
	`type` text DEFAULT 'VIDEO' NOT NULL,
	`video_url` text,
	`content` text,
	`pdf_url` text,
	`duration_minutes` integer,
	`position` integer DEFAULT 0 NOT NULL,
	`is_preview` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `course_sections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lessons_course_id_position_idx` ON `lessons` (`course_id`,`position`);--> statement-breakpoint
CREATE INDEX `lessons_section_id_position_idx` ON `lessons` (`section_id`,`position`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`read` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifications_user_id_read_idx` ON `notifications` (`user_id`,`read`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`item_type` text NOT NULL,
	`course_id` text,
	`bundle_id` text,
	`title` text NOT NULL,
	`unit_price` real NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`total_price` real NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`bundle_id`) REFERENCES `bundles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `order_items_order_id_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`number` integer NOT NULL,
	`student_id` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`subtotal` real NOT NULL,
	`discount` real DEFAULT 0 NOT NULL,
	`total` real NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`provider` text,
	`provider_ref` text,
	`paid_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_number_key` ON `orders` (`number`);--> statement-breakpoint
CREATE INDEX `orders_student_id_idx` ON `orders` (`student_id`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`first_name` text,
	`last_name` text,
	`headline` text,
	`bio` text,
	`avatar_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_user_id_key` ON `profiles` (`user_id`);--> statement-breakpoint
CREATE TABLE `program_enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`program_id` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`current_semester` integer DEFAULT 1 NOT NULL,
	`started_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `program_enrollments_student_id_program_id_key` ON `program_enrollments` (`student_id`,`program_id`);--> statement-breakpoint
CREATE INDEX `program_enrollments_student_id_idx` ON `program_enrollments` (`student_id`);--> statement-breakpoint
CREATE INDEX `program_enrollments_program_id_idx` ON `program_enrollments` (`program_id`);--> statement-breakpoint
CREATE TABLE `program_semesters` (
	`id` text PRIMARY KEY NOT NULL,
	`program_id` text NOT NULL,
	`bundle_id` text NOT NULL,
	`number` integer NOT NULL,
	`title` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`bundle_id`) REFERENCES `bundles`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `program_semesters_program_id_number_key` ON `program_semesters` (`program_id`,`number`);--> statement-breakpoint
CREATE UNIQUE INDEX `program_semesters_program_id_bundle_id_key` ON `program_semesters` (`program_id`,`bundle_id`);--> statement-breakpoint
CREATE INDEX `program_semesters_bundle_id_idx` ON `program_semesters` (`bundle_id`);--> statement-breakpoint
CREATE TABLE `programs` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`code` text,
	`short_description` text,
	`description` text,
	`thumbnail_url` text,
	`level` text DEFAULT 'Bachelor' NOT NULL,
	`semester_count` integer DEFAULT 4 NOT NULL,
	`access_duration_days` integer DEFAULT 120,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `programs_slug_key` ON `programs` (`slug`);--> statement-breakpoint
CREATE INDEX `programs_status_idx` ON `programs` (`status`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`course_id` text NOT NULL,
	`rating` integer DEFAULT 5 NOT NULL,
	`comment` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reviews_student_id_course_id_key` ON `reviews` (`student_id`,`course_id`);--> statement-breakpoint
CREATE INDEX `reviews_course_id_idx` ON `reviews` (`course_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'STUDENT' NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_key` ON `users` (`email`);