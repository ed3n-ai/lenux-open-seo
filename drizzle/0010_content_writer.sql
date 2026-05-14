CREATE TABLE `content_usage` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`month_key` text NOT NULL,
	`words_used` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_usage_org_month_idx` ON `content_usage` (`organization_id`,`month_key`);--> statement-breakpoint
CREATE TABLE `content_drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`topic` text NOT NULL,
	`audience` text NOT NULL,
	`tone` text NOT NULL,
	`keywords_json` text DEFAULT '[]' NOT NULL,
	`content` text NOT NULL,
	`word_count` integer NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `content_drafts_project_created_idx` ON `content_drafts` (`project_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `content_drafts_org_created_idx` ON `content_drafts` (`organization_id`,`created_at`);
