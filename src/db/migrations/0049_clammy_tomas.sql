CREATE TABLE `conversation_messages` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`conversation_id` bigint NOT NULL,
	`sender_id` bigint NOT NULL,
	`body` text NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `conversation_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_participants` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`conversation_id` bigint NOT NULL,
	`user_id` bigint NOT NULL,
	`last_read_at` datetime,
	`left_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `conversation_participants_id` PRIMARY KEY(`id`),
	CONSTRAINT `conv_part_idx` UNIQUE(`conversation_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`subject` varchar(200) NOT NULL,
	`starter_id` bigint NOT NULL,
	`last_message_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `conv_msg_idx` ON `conversation_messages` (`conversation_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `conv_part_user_idx` ON `conversation_participants` (`user_id`);--> statement-breakpoint
CREATE INDEX `conversations_last_idx` ON `conversations` (`last_message_at`);