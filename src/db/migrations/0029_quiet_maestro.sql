CREATE TABLE `bulk_mails` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`subject` varchar(200) NOT NULL,
	`audience` varchar(30) NOT NULL,
	`sent_count` int NOT NULL DEFAULT 0,
	`sent_by_id` bigint,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `bulk_mails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `privacy_requests` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`type` enum('deletion') NOT NULL DEFAULT 'deletion',
	`reason` varchar(500) NOT NULL DEFAULT '',
	`status` enum('open','completed','rejected') NOT NULL DEFAULT 'open',
	`resolved_by_id` bigint,
	`resolved_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `privacy_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`referrer_id` bigint NOT NULL,
	`referred_id` bigint NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `referrals_referred_idx` UNIQUE(`referred_id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `referred_by_id` bigint;--> statement-breakpoint
ALTER TABLE `users` ADD `bulk_mail_opt_out` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `deleted_at` datetime;--> statement-breakpoint
CREATE INDEX `privacy_requests_status_idx` ON `privacy_requests` (`status`);--> statement-breakpoint
CREATE INDEX `referrals_referrer_idx` ON `referrals` (`referrer_id`);