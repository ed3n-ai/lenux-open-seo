CREATE TABLE `wordpress_site_connections` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`project_id` text NOT NULL,
	`display_name` text DEFAULT 'Lenux28 SEO' NOT NULL,
	`site_url` text NOT NULL,
	`shared_secret` text NOT NULL,
	`last_status` text DEFAULT 'unchecked' NOT NULL,
	`last_error` text,
	`last_checked_at` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wordpress_site_connections_project_idx` ON `wordpress_site_connections` (`project_id`);--> statement-breakpoint
CREATE INDEX `wordpress_site_connections_org_idx` ON `wordpress_site_connections` (`organization_id`);
