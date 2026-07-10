CREATE TABLE `profile_visits` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`profile_id` bigint NOT NULL,
	`visitor_id` bigint NOT NULL,
	`last_visit_at` datetime NOT NULL,
	CONSTRAINT `profile_visits_id` PRIMARY KEY(`id`),
	CONSTRAINT `profile_visits_pair_idx` UNIQUE(`profile_id`,`visitor_id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `show_visitors` boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX `profile_visits_profile_idx` ON `profile_visits` (`profile_id`,`last_visit_at`);