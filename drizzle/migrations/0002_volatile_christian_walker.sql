CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`course_id` text NOT NULL,
	`student_id` text,
	`instructor_id` text,
	`last_message_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `conversations_course_id_type_idx` ON `conversations` (`course_id`,`type`);--> statement-breakpoint
CREATE INDEX `conversations_student_id_idx` ON `conversations` (`student_id`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `messages_conversation_id_created_at_idx` ON `messages` (`conversation_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `notifications` ADD `url` text;