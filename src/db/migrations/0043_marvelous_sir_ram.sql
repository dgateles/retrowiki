CREATE TABLE `oauth_accounts` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`provider` varchar(32) NOT NULL DEFAULT 'google',
	`provider_account_id` varchar(255) NOT NULL,
	`email` varchar(255),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `oauth_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `oauth_provider_account_idx` UNIQUE(`provider`,`provider_account_id`)
);
--> statement-breakpoint
CREATE TABLE `oauth_link_states` (
	`id` varchar(64) NOT NULL,
	`user_id` bigint NOT NULL,
	`code_verifier` varchar(128) NOT NULL,
	`expires_at` datetime NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `oauth_link_states_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `oauth_user_idx` ON `oauth_accounts` (`user_id`);