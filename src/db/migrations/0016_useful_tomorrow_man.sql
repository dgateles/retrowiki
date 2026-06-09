CREATE TABLE `ip_geo` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`ip` varchar(45) NOT NULL,
	`label` varchar(160) NOT NULL DEFAULT '',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `ip_geo_id` PRIMARY KEY(`id`),
	CONSTRAINT `ip_geo_ip_idx` UNIQUE(`ip`)
);
