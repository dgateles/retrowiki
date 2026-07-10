CREATE TABLE `forum_categories` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`title` varchar(120) NOT NULL,
	`description` varchar(300),
	`sort_order` int NOT NULL DEFAULT 0,
	`visible` boolean NOT NULL DEFAULT true,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `forum_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forum_post_reactions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`post_id` bigint NOT NULL,
	`reaction_id` bigint,
	`value` int NOT NULL DEFAULT 1,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `forum_post_reactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `forum_post_reactions_user_post_idx` UNIQUE(`user_id`,`post_id`)
);
--> statement-breakpoint
CREATE TABLE `forum_posts` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`topic_id` bigint NOT NULL,
	`author_id` bigint NOT NULL,
	`body` text NOT NULL,
	`status` enum('visible','hidden','flagged') NOT NULL DEFAULT 'visible',
	`is_first` boolean NOT NULL DEFAULT false,
	`edited_at` datetime,
	`edited_by_id` bigint,
	`deleted_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `forum_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forum_topic_follows` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`topic_id` bigint NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `forum_topic_follows_id` PRIMARY KEY(`id`),
	CONSTRAINT `forum_topic_follows_user_topic_idx` UNIQUE(`user_id`,`topic_id`)
);
--> statement-breakpoint
CREATE TABLE `forum_topics` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`forum_id` bigint NOT NULL,
	`author_id` bigint NOT NULL,
	`title` varchar(200) NOT NULL,
	`slug` varchar(220) NOT NULL,
	`status` enum('open','locked','archived','hidden','pending') NOT NULL DEFAULT 'open',
	`pinned` boolean NOT NULL DEFAULT false,
	`is_question` boolean NOT NULL DEFAULT false,
	`best_post_id` bigint,
	`views` int NOT NULL DEFAULT 0,
	`posts_count` int NOT NULL DEFAULT 0,
	`first_post_id` bigint,
	`last_post_id` bigint,
	`last_post_at` datetime,
	`last_poster_id` bigint,
	`deleted_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `forum_topics_id` PRIMARY KEY(`id`),
	CONSTRAINT `forum_topics_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `forums` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`category_id` bigint NOT NULL,
	`parent_id` bigint,
	`title` varchar(120) NOT NULL,
	`slug` varchar(140) NOT NULL,
	`description` varchar(300),
	`icon` varchar(40),
	`sort_order` int NOT NULL DEFAULT 0,
	`visible` boolean NOT NULL DEFAULT true,
	`locked` boolean NOT NULL DEFAULT false,
	`min_read_role` enum('member','contributor','moderator','admin') NOT NULL DEFAULT 'member',
	`min_post_role` enum('member','contributor','moderator','admin') NOT NULL DEFAULT 'member',
	`topics_count` int NOT NULL DEFAULT 0,
	`posts_count` int NOT NULL DEFAULT 0,
	`last_post_id` bigint,
	`last_post_at` datetime,
	`last_poster_id` bigint,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `forums_id` PRIMARY KEY(`id`),
	CONSTRAINT `forums_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE INDEX `forum_categories_order_idx` ON `forum_categories` (`sort_order`);--> statement-breakpoint
CREATE INDEX `forum_post_reactions_post_idx` ON `forum_post_reactions` (`post_id`);--> statement-breakpoint
CREATE INDEX `forum_posts_topic_idx` ON `forum_posts` (`topic_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `forum_posts_author_idx` ON `forum_posts` (`author_id`);--> statement-breakpoint
CREATE INDEX `forum_topic_follows_topic_idx` ON `forum_topic_follows` (`topic_id`);--> statement-breakpoint
CREATE INDEX `forum_topics_forum_idx` ON `forum_topics` (`forum_id`,`status`,`last_post_at`);--> statement-breakpoint
CREATE INDEX `forum_topics_author_idx` ON `forum_topics` (`author_id`);--> statement-breakpoint
CREATE INDEX `forums_category_idx` ON `forums` (`category_id`,`sort_order`);