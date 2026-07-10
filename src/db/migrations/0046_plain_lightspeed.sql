CREATE TABLE `forum_poll_choices` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`question_id` bigint NOT NULL,
	`label` varchar(300) NOT NULL,
	`votes_count` int NOT NULL DEFAULT 0,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `forum_poll_choices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forum_poll_questions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`poll_id` bigint NOT NULL,
	`title` varchar(300) NOT NULL,
	`multiple` boolean NOT NULL DEFAULT false,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `forum_poll_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forum_poll_votes` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`poll_id` bigint NOT NULL,
	`question_id` bigint NOT NULL,
	`choice_id` bigint NOT NULL,
	`user_id` bigint NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `forum_poll_votes_id` PRIMARY KEY(`id`),
	CONSTRAINT `forum_poll_votes_user_choice_idx` UNIQUE(`user_id`,`choice_id`)
);
--> statement-breakpoint
CREATE TABLE `forum_polls` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`topic_id` bigint NOT NULL,
	`title` varchar(200),
	`public_voters` boolean NOT NULL DEFAULT false,
	`closes_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `forum_polls_id` PRIMARY KEY(`id`),
	CONSTRAINT `forum_polls_topic_idx` UNIQUE(`topic_id`)
);
--> statement-breakpoint
CREATE INDEX `forum_poll_choices_question_idx` ON `forum_poll_choices` (`question_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `forum_poll_questions_poll_idx` ON `forum_poll_questions` (`poll_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `forum_poll_votes_poll_idx` ON `forum_poll_votes` (`poll_id`);--> statement-breakpoint
CREATE INDEX `forum_poll_votes_user_poll_idx` ON `forum_poll_votes` (`user_id`,`poll_id`);