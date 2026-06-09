CREATE TABLE `assignments` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`target_type` enum('article') NOT NULL DEFAULT 'article',
	`target_id` bigint NOT NULL,
	`assignee_type` enum('user','team') NOT NULL,
	`assignee_id` bigint NOT NULL,
	`note` varchar(500) NOT NULL DEFAULT '',
	`status` enum('open','closed') NOT NULL DEFAULT 'open',
	`assigned_by_id` bigint,
	`closed_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mod_team_members` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`team_id` bigint NOT NULL,
	`user_id` bigint NOT NULL,
	CONSTRAINT `mod_team_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `mod_team_member_idx` UNIQUE(`team_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `mod_teams` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `mod_teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `assignments_target_idx` ON `assignments` (`target_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `assignments_status_idx` ON `assignments` (`status`);