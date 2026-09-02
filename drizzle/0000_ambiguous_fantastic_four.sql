CREATE TABLE `inspections` (
	`seq` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id` text NOT NULL,
	`business_key` text NOT NULL,
	`station_id` text NOT NULL,
	`payload` text NOT NULL,
	FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inspections_id_unique` ON `inspections` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `inspections_business_key` ON `inspections` (`business_key`);--> statement-breakpoint
CREATE TABLE `stations` (
	`seq` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id` text NOT NULL,
	`station_key` text NOT NULL,
	`payload` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stations_id_unique` ON `stations` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `stations_station_key_unique` ON `stations` (`station_key`);