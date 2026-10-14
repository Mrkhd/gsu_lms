CREATE TABLE `course_locks` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`course_id` text NOT NULL,
	`locked_by` text,
	`reason` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `course_locks_student_id_course_id_key` ON `course_locks` (`student_id`,`course_id`);--> statement-breakpoint
CREATE INDEX `course_locks_student_id_idx` ON `course_locks` (`student_id`);--> statement-breakpoint
CREATE INDEX `course_locks_course_id_idx` ON `course_locks` (`course_id`);