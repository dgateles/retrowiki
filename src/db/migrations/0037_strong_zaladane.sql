CREATE TABLE `page_blocks` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`layout` json NOT NULL,
	`created_by_id` bigint,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `page_blocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `page_blocks_name_idx` ON `page_blocks` (`name`);