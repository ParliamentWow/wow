CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`vidioUrl` text NOT NULL,
	`room` text NOT NULL,
	`timestamp` integer NOT NULL,
	`bills` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transcriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`sessionId` text NOT NULL,
	`content` text NOT NULL,
	`timestamp_start` integer NOT NULL,
	`timestamp_end` integer NOT NULL
);
