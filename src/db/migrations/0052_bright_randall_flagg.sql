CREATE TABLE `mfa_recovery_codes` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`code_hash` varchar(128) NOT NULL,
	`used_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `mfa_recovery_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `mfa_recovery_codes_hash_idx` UNIQUE(`code_hash`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `totp_secret` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `totp_enabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `mfa_recovery_codes_user_idx` ON `mfa_recovery_codes` (`user_id`);