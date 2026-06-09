CREATE TABLE `geo_rules` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`country_code` varchar(2) NOT NULL,
	`action` enum('flag','block') NOT NULL DEFAULT 'flag',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `geo_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `geo_rules_country_idx` UNIQUE(`country_code`)
);
--> statement-breakpoint
CREATE TABLE `spam_questions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`question` varchar(255) NOT NULL,
	`answers` json NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `spam_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `spam_questions_order_idx` ON `spam_questions` (`sort_order`);