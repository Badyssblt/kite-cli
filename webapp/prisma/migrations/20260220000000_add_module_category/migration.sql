-- AlterTable
ALTER TABLE `Module` ADD COLUMN `category` VARCHAR(191) NOT NULL DEFAULT 'other';

-- UpdateCategories (composite ids: frameworkId-moduleId)
UPDATE `Module` SET `category` = 'database' WHERE `id` LIKE '%-prisma' OR `id` LIKE '%-supabase';
UPDATE `Module` SET `category` = 'auth' WHERE `id` LIKE '%-better-auth';
UPDATE `Module` SET `category` = 'ui' WHERE `id` LIKE '%-tailwind' OR `id` LIKE '%-shadcn' OR `id` LIKE '%-nuxt-ui';
UPDATE `Module` SET `category` = 'testing' WHERE `id` LIKE '%-vitest' OR `id` LIKE '%-eslint';
UPDATE `Module` SET `category` = 'devops' WHERE `id` LIKE '%-docker';
UPDATE `Module` SET `category` = 'state' WHERE `id` LIKE '%-pinia' OR `id` LIKE '%-zustand';
UPDATE `Module` SET `category` = 'i18n' WHERE `id` LIKE '%-i18n';
UPDATE `Module` SET `category` = 'payment' WHERE `id` LIKE '%-stripe';
UPDATE `Module` SET `category` = 'email' WHERE `id` LIKE '%-email';
