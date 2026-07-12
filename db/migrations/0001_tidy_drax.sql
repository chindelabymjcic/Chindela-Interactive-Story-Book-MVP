ALTER TABLE `notifications` MODIFY COLUMN `type` enum('diary_entry','ai_feedback','subscription_expiry','safety_alert','milestone','system','payment_succeeded','payment_failed') NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `stripe_subscription_id` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `stripe_customer_id` varchar(255);--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_stripe_subscription_id_idx` UNIQUE(`stripe_subscription_id`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_stripe_customer_id_idx` UNIQUE(`stripe_customer_id`);