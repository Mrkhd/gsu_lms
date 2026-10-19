CREATE TABLE `inbound_emails` (
	`id` text PRIMARY KEY NOT NULL,
	`resend_email_id` text NOT NULL,
	`recipient_user_id` text,
	`from_email` text NOT NULL,
	`from_name` text,
	`to_email` text NOT NULL,
	`subject` text,
	`text_body` text,
	`html_body` text,
	`message_id` text,
	`received_at` integer NOT NULL,
	`read_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`recipient_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inbound_emails_resend_email_id_key` ON `inbound_emails` (`resend_email_id`);--> statement-breakpoint
CREATE INDEX `inbound_emails_recipient_idx` ON `inbound_emails` (`recipient_user_id`,`read_at`);