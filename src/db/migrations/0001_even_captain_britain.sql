UPDATE `device_specs` SET `cpu` = `chip` WHERE (`cpu` IS NULL OR `cpu` = '') AND `chip` IS NOT NULL;
--> statement-breakpoint
ALTER TABLE `device_specs` DROP COLUMN `chip`;
