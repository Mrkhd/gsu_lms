CREATE TABLE `assignment_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`assignment_id` text NOT NULL,
	`student_id` text NOT NULL,
	`course_id` text NOT NULL,
	`file_key` text NOT NULL,
	`file_name` text NOT NULL,
	`submitted_at` integer NOT NULL,
	`status` text DEFAULT 'SUBMITTED' NOT NULL,
	`grade` real,
	`feedback` text,
	`graded_at` integer,
	`graded_by_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assignment_submissions_assignment_student_key` ON `assignment_submissions` (`assignment_id`,`student_id`);--> statement-breakpoint
CREATE INDEX `assignment_submissions_assignment_id_idx` ON `assignment_submissions` (`assignment_id`);--> statement-breakpoint
CREATE INDEX `assignment_submissions_student_id_idx` ON `assignment_submissions` (`student_id`);--> statement-breakpoint
CREATE TABLE `assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`due_at` integer,
	`max_points` integer DEFAULT 100 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `assignments_course_id_idx` ON `assignments` (`course_id`);