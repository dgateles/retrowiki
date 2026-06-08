CREATE TABLE `articles` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`type` enum('tutorial','buying_guide','troubleshooting','firmware','general') NOT NULL,
	`title` varchar(200) NOT NULL,
	`summary` varchar(320),
	`device_id` bigint,
	`author_id` bigint NOT NULL,
	`status` enum('draft','pending','changes_requested','published','rejected','archived') NOT NULL DEFAULT 'draft',
	`current_revision_id` bigint,
	`search_text` text,
	`votes_up` int NOT NULL DEFAULT 0,
	`published_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `articles_id` PRIMARY KEY(`id`),
	CONSTRAINT `articles_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`actor_id` bigint,
	`action` varchar(80) NOT NULL,
	`target` varchar(120) NOT NULL,
	`meta` json,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `captcha_nonces` (
	`nonce` varchar(64) NOT NULL,
	`expires_at` datetime NOT NULL,
	CONSTRAINT `captcha_nonces_nonce` PRIMARY KEY(`nonce`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`label` varchar(120) NOT NULL,
	`kind` enum('rating','power','size','os','form','generic') NOT NULL DEFAULT 'generic',
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`article_id` bigint NOT NULL,
	`author_id` bigint NOT NULL,
	`body` text NOT NULL,
	`status` enum('visible','hidden','flagged') NOT NULL DEFAULT 'visible',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `device_categories` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`device_id` bigint NOT NULL,
	`category_id` bigint NOT NULL,
	CONSTRAINT `device_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `device_category_idx` UNIQUE(`device_id`,`category_id`)
);
--> statement-breakpoint
CREATE TABLE `device_images` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`device_id` bigint NOT NULL,
	`url` varchar(500) NOT NULL,
	`kind` enum('front','article','gallery') NOT NULL DEFAULT 'front',
	`alt` varchar(300) NOT NULL,
	`credit` varchar(200),
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `device_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `device_specs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`device_id` bigint NOT NULL,
	`chip` varchar(160),
	`cpu` varchar(160),
	`gpu` varchar(160),
	`ram_gb` float,
	`ram_type` varchar(60),
	`storage` varchar(120),
	`architecture` varchar(60),
	`screen_size` float,
	`resolution` varchar(40),
	`aspect_ratio` varchar(40),
	`refresh_hz` int,
	`panel_type` varchar(40),
	`battery_mah` int,
	`cooling` boolean,
	`vibration` boolean,
	`os` varchar(120),
	`wifi` boolean,
	`bluetooth` boolean,
	`bt_version` varchar(20),
	`video_out` boolean,
	`audio_jack` boolean,
	`usb_c` boolean,
	`sd_card` boolean,
	`analogs` boolean,
	`hall_effect` boolean,
	`analog_triggers` boolean,
	`l1r1` boolean,
	`l2r2` boolean,
	`l3r3` boolean,
	`touch_screen` boolean,
	`gyroscope` boolean,
	CONSTRAINT `device_specs_id` PRIMARY KEY(`id`),
	CONSTRAINT `device_specs_device_idx` UNIQUE(`device_id`)
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`slug` varchar(120) NOT NULL,
	`name` varchar(160) NOT NULL,
	`manufacturer` varchar(120) NOT NULL,
	`release_year` int,
	`price_usd` int,
	`form_factor` enum('vertical','horizontal','clamshell','other') NOT NULL DEFAULT 'other',
	`rating` float DEFAULT 0,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'published',
	`extra` json,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `devices_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `email_suppressions` (
	`email` varchar(255) NOT NULL,
	`reason` varchar(120) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `email_suppressions_email` PRIMARY KEY(`email`)
);
--> statement-breakpoint
CREATE TABLE `emulation_scores` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`device_id` bigint NOT NULL,
	`system` varchar(40) NOT NULL,
	`score` int NOT NULL,
	CONSTRAINT `emulation_scores_id` PRIMARY KEY(`id`),
	CONSTRAINT `emu_device_system_idx` UNIQUE(`device_id`,`system`)
);
--> statement-breakpoint
CREATE TABLE `github_repos` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`owner` varchar(100) NOT NULL,
	`repo` varchar(120) NOT NULL,
	`last_synced` datetime,
	`cache` json,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `github_repos_id` PRIMARY KEY(`id`),
	CONSTRAINT `github_repos_owner_repo_idx` UNIQUE(`owner`,`repo`)
);
--> statement-breakpoint
CREATE TABLE `notification_prefs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`type` varchar(80) NOT NULL,
	`channel` enum('in_app','email') NOT NULL,
	`mode` enum('immediate','daily_digest') NOT NULL DEFAULT 'immediate',
	`enabled` boolean NOT NULL DEFAULT true,
	CONSTRAINT `notification_prefs_id` PRIMARY KEY(`id`),
	CONSTRAINT `notif_pref_idx` UNIQUE(`user_id`,`type`,`channel`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`recipient_id` bigint NOT NULL,
	`type` varchar(80) NOT NULL,
	`payload` json,
	`read_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`revision_id` bigint NOT NULL,
	`reviewer_id` bigint,
	`decision` enum('pending','approved','changes_requested','rejected') NOT NULL DEFAULT 'pending',
	`reason` varchar(500),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `reviews_revision_idx` UNIQUE(`revision_id`)
);
--> statement-breakpoint
CREATE TABLE `revisions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`article_id` bigint NOT NULL,
	`body` json NOT NULL,
	`editor_id` bigint NOT NULL,
	`note` varchar(300),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `revisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stores` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`domain` varchar(200) NOT NULL,
	`trust` enum('verified','trusted','caution') NOT NULL DEFAULT 'caution',
	`affiliate` boolean NOT NULL DEFAULT false,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `stores_id` PRIMARY KEY(`id`),
	CONSTRAINT `stores_domain_idx` UNIQUE(`domain`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`handle` varchar(60) NOT NULL,
	`display_name` varchar(120) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('member','contributor','moderator','admin') NOT NULL DEFAULT 'member',
	`avatar_url` varchar(500),
	`reputation` int NOT NULL DEFAULT 0,
	`trusted` boolean NOT NULL DEFAULT false,
	`is_suspended` boolean NOT NULL DEFAULT false,
	`email_verified_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_idx` UNIQUE(`email`),
	CONSTRAINT `users_handle_idx` UNIQUE(`handle`)
);
--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint,
	`email` varchar(255) NOT NULL,
	`purpose` enum('email_verify','password_reset','email_change','magic_link') NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`expires_at` datetime NOT NULL,
	`consumed_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `verification_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `vt_token_hash_idx` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`article_id` bigint NOT NULL,
	`value` int NOT NULL DEFAULT 1,
	CONSTRAINT `votes_id` PRIMARY KEY(`id`),
	CONSTRAINT `votes_user_article_idx` UNIQUE(`user_id`,`article_id`)
);
--> statement-breakpoint
CREATE INDEX `articles_type_status_idx` ON `articles` (`type`,`status`);--> statement-breakpoint
CREATE INDEX `articles_device_idx` ON `articles` (`device_id`);--> statement-breakpoint
CREATE INDEX `articles_author_idx` ON `articles` (`author_id`);--> statement-breakpoint
CREATE INDEX `audit_actor_idx` ON `audit_log` (`actor_id`);--> statement-breakpoint
CREATE INDEX `audit_target_idx` ON `audit_log` (`target`);--> statement-breakpoint
CREATE INDEX `captcha_nonces_exp_idx` ON `captcha_nonces` (`expires_at`);--> statement-breakpoint
CREATE INDEX `comments_article_idx` ON `comments` (`article_id`);--> statement-breakpoint
CREATE INDEX `device_images_device_idx` ON `device_images` (`device_id`);--> statement-breakpoint
CREATE INDEX `devices_manufacturer_idx` ON `devices` (`manufacturer`);--> statement-breakpoint
CREATE INDEX `devices_form_factor_idx` ON `devices` (`form_factor`);--> statement-breakpoint
CREATE INDEX `notifications_recipient_idx` ON `notifications` (`recipient_id`,`read_at`);--> statement-breakpoint
CREATE INDEX `reviews_decision_idx` ON `reviews` (`decision`);--> statement-breakpoint
CREATE INDEX `revisions_article_idx` ON `revisions` (`article_id`);--> statement-breakpoint
CREATE INDEX `vt_email_purpose_idx` ON `verification_tokens` (`email`,`purpose`);