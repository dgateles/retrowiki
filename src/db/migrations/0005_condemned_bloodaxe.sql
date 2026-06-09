CREATE TABLE `role_permissions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`role` varchar(20) NOT NULL,
	`permissions` json NOT NULL,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `role_permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `role_permissions_role_idx` UNIQUE(`role`)
);
