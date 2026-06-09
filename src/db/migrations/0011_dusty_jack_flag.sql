CREATE TABLE `app_settings` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`key` varchar(60) NOT NULL,
	`value` json NOT NULL,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `app_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `app_settings_key_idx` UNIQUE(`key`)
);
