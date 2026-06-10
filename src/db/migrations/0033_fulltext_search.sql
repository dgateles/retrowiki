ALTER TABLE `articles` ADD FULLTEXT INDEX `articles_ft_idx` (`title`, `summary`, `search_text`);--> statement-breakpoint
ALTER TABLE `devices` ADD FULLTEXT INDEX `devices_ft_idx` (`name`, `manufacturer`);
