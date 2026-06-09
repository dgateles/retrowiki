CREATE TABLE `quest_opt_outs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`quest_id` bigint NOT NULL,
	`user_id` bigint NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `quest_opt_outs_id` PRIMARY KEY(`id`),
	CONSTRAINT `quest_opt_out_idx` UNIQUE(`quest_id`,`user_id`)
);
--> statement-breakpoint
ALTER TABLE `quests` ADD `cover_image` varchar(500);--> statement-breakpoint
ALTER TABLE `quests` ADD `starts_at` datetime;--> statement-breakpoint
ALTER TABLE `quests` ADD `ends_at` datetime;--> statement-breakpoint
ALTER TABLE `quests` ADD `audience_roles` json;--> statement-breakpoint
ALTER TABLE `quests` ADD `allow_opt_out` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `quests` ADD `retroactive` boolean DEFAULT false NOT NULL;