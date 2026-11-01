ALTER TABLE `assignment_submissions` ADD `rubric_scores` text;--> statement-breakpoint
ALTER TABLE `assignments` ADD `rubric` text DEFAULT '[]' NOT NULL;