CREATE TABLE `quest_completions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`quest_id` bigint NOT NULL,
	`user_id` bigint NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `quest_completions_id` PRIMARY KEY(`id`),
	CONSTRAINT `quest_completion_idx` UNIQUE(`quest_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `quest_task_completions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`task_id` bigint NOT NULL,
	`user_id` bigint NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `quest_task_completions_id` PRIMARY KEY(`id`),
	CONSTRAINT `quest_task_completion_idx` UNIQUE(`task_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `quest_tasks` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`quest_id` bigint NOT NULL,
	`title` varchar(160) NOT NULL,
	`description` varchar(1000) NOT NULL DEFAULT '',
	`link` varchar(400),
	`rule_id` bigint NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `quest_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quests` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`title` varchar(160) NOT NULL,
	`description` varchar(2000) NOT NULL DEFAULT '',
	`enabled` boolean NOT NULL DEFAULT false,
	`sort_order` int NOT NULL DEFAULT 0,
	`reward_badge` varchar(80),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `quests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `quest_tasks_quest_idx` ON `quest_tasks` (`quest_id`);--> statement-breakpoint
CREATE INDEX `quest_tasks_rule_idx` ON `quest_tasks` (`rule_id`);--> statement-breakpoint
CREATE INDEX `quests_order_idx` ON `quests` (`sort_order`);