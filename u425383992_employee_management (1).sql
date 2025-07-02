-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jul 02, 2025 at 09:32 AM
-- Server version: 8.0.36
-- PHP Version: 8.3.8

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u425383992_employee_management`
--

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
CREATE TABLE IF NOT EXISTS `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
CREATE TABLE IF NOT EXISTS `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `company_info`
--

DROP TABLE IF EXISTS `company_info`;
CREATE TABLE IF NOT EXISTS `company_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `block_status` tinyint(1) NOT NULL,
  `logo` varchar(255) NOT NULL,
  `sign` varchar(255) NOT NULL,
  `land_mark` varchar(255) NOT NULL,
  `Tal` varchar(255) NOT NULL,
  `Dist` varchar(255) NOT NULL,
  `pincode` int NOT NULL,
  `phone_no` varchar(255) NOT NULL,
  `email_id` varchar(255) DEFAULT NULL,
  `bank_name` varchar(255) NOT NULL,
  `account_no` varchar(255) NOT NULL,
  `IFSC_code` varchar(255) NOT NULL,
  `paymentQRCode` varchar(255) NOT NULL,
  `appMode` varchar(255) DEFAULT NULL,
  `subscribed_plan` int NOT NULL DEFAULT '1',
  `subscription_validity` date DEFAULT NULL,
  `refer_by_id` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `company_info_phone_no_unique` (`phone_no`),
  UNIQUE KEY `company_info_email_id_unique` (`email_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `company_receipts`
--

DROP TABLE IF EXISTS `company_receipts`;
CREATE TABLE IF NOT EXISTS `company_receipts` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `plan_id` int NOT NULL,
  `user_id` int NOT NULL,
  `valid_till` date NOT NULL,
  `total_amount` decimal(8,2) NOT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `transaction_status` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `company_receipts_company_id_foreign` (`company_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `employee`
--

DROP TABLE IF EXISTS `employee`;
CREATE TABLE IF NOT EXISTS `employee` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` bigint UNSIGNED NOT NULL,
  `company_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `gender` enum('male','female','other') NOT NULL,
  `payment_type` enum('weekly','monthly') NOT NULL DEFAULT 'monthly',
  `work_type` enum('fulltime','contract') NOT NULL DEFAULT 'fulltime',
  `price` double NOT NULL DEFAULT '0',
  `wage_hour` double NOT NULL,
  `wage_overtime` double NOT NULL,
  `credit` double NOT NULL DEFAULT '0',
  `debit` double NOT NULL DEFAULT '0',
  `adhaar_number` varchar(255) DEFAULT NULL,
  `mobile` varchar(255) NOT NULL,
  `refferal_by` varchar(255) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `employee_product_id_foreign` (`product_id`),
  KEY `employee_company_id_foreign` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `employee_details`
--

DROP TABLE IF EXISTS `employee_details`;
CREATE TABLE IF NOT EXISTS `employee_details` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` bigint UNSIGNED NOT NULL,
  `employee_id` bigint UNSIGNED NOT NULL,
  `company_id` int NOT NULL,
  `document_name` varchar(255) NOT NULL,
  `document_link` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `employee_details_product_id_foreign` (`product_id`),
  KEY `employee_details_employee_id_foreign` (`employee_id`),
  KEY `employee_details_company_id_foreign` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `employee_tracker`
--

DROP TABLE IF EXISTS `employee_tracker`;
CREATE TABLE IF NOT EXISTS `employee_tracker` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` bigint UNSIGNED NOT NULL,
  `employee_id` bigint UNSIGNED NOT NULL,
  `company_id` int NOT NULL,
  `check_in` tinyint(1) NOT NULL DEFAULT '0',
  `check_out` tinyint(1) NOT NULL DEFAULT '0',
  `payment_status` tinyint(1) NOT NULL DEFAULT '0',
  `check_in_gps` varchar(255) DEFAULT NULL,
  `check_out_gps` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `employee_tracker_product_id_foreign` (`product_id`),
  KEY `employee_tracker_employee_id_foreign` (`employee_id`),
  KEY `employee_tracker_company_id_foreign` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `employee_transaction`
--

DROP TABLE IF EXISTS `employee_transaction`;
CREATE TABLE IF NOT EXISTS `employee_transaction` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` bigint UNSIGNED NOT NULL,
  `employee_id` bigint UNSIGNED NOT NULL,
  `company_id` int NOT NULL,
  `transaction_type` enum('credit','payment') NOT NULL,
  `payment_type` enum('cash','upi','bank_transfer') NOT NULL,
  `salary_amount` double NOT NULL,
  `payed_amount` double NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `employee_transaction_product_id_foreign` (`product_id`),
  KEY `employee_transaction_employee_id_foreign` (`employee_id`),
  KEY `employee_transaction_company_id_foreign` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
CREATE TABLE IF NOT EXISTS `failed_jobs` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint UNSIGNED NOT NULL,
  `reserved_at` int UNSIGNED DEFAULT NULL,
  `available_at` int UNSIGNED NOT NULL,
  `created_at` int UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
CREATE TABLE IF NOT EXISTS `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(31, '2024_06_17_082332_create_orders_table', 11),
(5, '2024_06_15_134930_create_personal_access_tokens_table', 1),
(6, '2024_06_16_051347_create_categories_table', 1),
(7, '2024_06_16_051439_create_sub_categories_table', 1),
(8, '2024_06_16_051452_create_sub_sub_categories_table', 1),
(29, '2024_10_27_084746_create_jar_trackers_table', 10),
(10, '2024_06_19_035448_create_expense_types_table', 1),
(11, '2024_06_19_043803_create_expenses_table', 1),
(39, '2025_04_16_074630_create_milk_tanks_table', 19),
(13, '2024_08_12_112429_add_company_id_to_tables', 2),
(22, '2024_10_26_061733_create_customers_table', 5),
(32, '2025_04_16_074501_create_company_info_table', 12),
(34, '2025_04_16_074914_create_products_table', 14),
(21, '2024_10_27_100649_create_payment_trackers_table', 4),
(35, '2025_04_16_084302_create_raw_materials_table', 15),
(36, '2025_04_16_084540_create_milk_procesing_table', 16),
(37, '2025_04_16_090049_create_processed_ingredients_table', 17),
(38, '2025_04_16_090209_create_products_trackers_table', 18),
(40, '2025_04_18_105632_update_raw_materials_table', 20),
(41, '2025_04_18_111549_update_milk_tanks_table', 21),
(42, '2025_04_18_112210_update_milk_processing_table', 22),
(43, '2025_04_18_112413_update_processed_ingredients_table', 23),
(44, '2025_04_18_112556_update_products_trackers_table', 24),
(45, '2025_04_27_055108_add_remark_to_order_details_table', 25),
(47, '2025_04_28_092534_update_products_tracker_table', 26),
(48, '2025_04_28_094422_factory_product_table', 27),
(49, '2025_04_29_171758_update_product_size_table', 28),
(50, '2025_02_02_060719_alter_company_info', 29),
(51, '2025_05_02_094638_add_remark_to_jar_tracker_table', 30),
(52, '2025_05_06_064319_fix_foreign_key_on_products_tracker', 31),
(53, '2025_05_03_022142_create_daily_tallies_table', 32),
(54, '2025_04_23_061045_create_milk_tanks_tracker_table', 33),
(57, '2025_05_27_135606_product_formula_table', 34),
(58, '2025_05_27_152833_add_lab_fields_to_milk_tanks_table', 35),
(59, '2025_05_27_153127_add_lab_fields_to_milk_tanks_tracker_table', 36),
(60, '2025_05_28_125455_add_feild_name_in_product_formula_table', 37),
(61, '2025_05_28_154307_create_product_components_table', 38),
(62, '2025_07_02_111633_create_products_table', 39),
(63, '2025_07_01_174821_create_employee_table', 40),
(64, '2025_07_01_190652_create_employee_details_table', 41),
(65, '2025_07_01_193536_create_employee_transaction_table', 42),
(66, '2025_07_02_102736_create_employee_tracker_table', 43);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `payment_trackers`
--

DROP TABLE IF EXISTS `payment_trackers`;
CREATE TABLE IF NOT EXISTS `payment_trackers` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_id` bigint UNSIGNED NOT NULL,
  `amount` double NOT NULL DEFAULT '0',
  `isCredit` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `updated_by` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payment_trackers_customer_id_foreign` (`customer_id`)
) ENGINE=MyISAM AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `payment_trackers`
--

INSERT INTO `payment_trackers` (`id`, `customer_id`, `amount`, `isCredit`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
(1, 1, -5600, 1, 11, 11, '2025-05-07 06:44:49', '2025-06-12 14:07:29'),
(2, 2, -400, 1, 11, 11, '2025-05-07 19:13:38', '2025-05-09 17:44:50'),
(3, 4, 0, 1, 11, 11, '2025-05-08 10:20:45', '2025-05-08 10:20:45'),
(4, 3, 0, 1, 11, 11, '2025-05-08 10:24:06', '2025-05-24 11:41:57'),
(5, 5, 0, 1, 12, 12, '2025-05-09 12:14:58', '2025-05-09 12:14:58'),
(6, 7, 0, 1, 12, 12, '2025-05-09 12:20:35', '2025-05-09 12:20:35'),
(7, 8, 0, 1, 12, 12, '2025-05-09 12:39:56', '2025-05-09 12:39:56'),
(8, 6, 0, 1, 12, 12, '2025-05-09 19:00:05', '2025-05-09 19:00:05'),
(9, 17, -400, 1, 17, 17, '2025-05-16 12:05:47', '2025-05-16 12:05:47'),
(10, 18, -32680, 1, 17, 17, '2025-05-16 12:08:00', '2025-05-24 15:09:55'),
(11, 19, 0, 1, 16, 16, '2025-05-16 13:08:01', '2025-05-16 13:08:01'),
(12, 21, -135704, 1, 16, 16, '2025-05-16 18:05:19', '2025-05-16 20:22:55'),
(13, 20, 0, 1, 16, 16, '2025-05-16 18:20:52', '2025-05-16 18:20:52'),
(14, 22, 0, 1, 16, 16, '2025-05-16 18:29:12', '2025-05-16 18:29:12'),
(15, 23, -200, 1, 16, 16, '2025-05-16 18:30:01', '2025-05-16 18:30:01'),
(16, 24, 0, 1, 16, 16, '2025-05-16 18:31:01', '2025-05-16 18:31:01'),
(17, 25, 0, 1, 16, 16, '2025-05-16 19:29:30', '2025-05-16 19:29:30'),
(18, 26, -400, 1, 16, 16, '2025-05-16 19:46:05', '2025-05-16 19:46:05'),
(19, 27, 0, 1, 16, 16, '2025-05-16 19:55:31', '2025-05-16 19:55:31'),
(20, 28, 0, 1, 16, 16, '2025-05-16 19:56:04', '2025-05-16 19:56:04'),
(21, 10, -6250, 1, 17, 17, '2025-05-16 20:25:46', '2025-05-24 11:50:58'),
(22, 11, 0, 1, 16, 16, '2025-05-20 14:53:36', '2025-05-20 14:53:36'),
(23, 29, -800, 1, 22, 22, '2025-05-24 03:27:32', '2025-05-24 03:31:31'),
(24, 30, -2000, 1, 16, 16, '2025-05-24 09:30:48', '2025-05-24 09:30:48');

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
CREATE TABLE IF NOT EXISTS `personal_access_tokens` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
) ENGINE=MyISAM AUTO_INCREMENT=431 DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(409, 'App\\Models\\User', 8, 'webapp', '5fc0e38ab1ed0bce98550b2790aa65262e0ad7fec3849f58ea2584cac443dd6a', '[{\"id\":8,\"company_id\":6,\"name\":\"Shop Owner\",\"email\":\"admin@demo.com\",\"mobile\":\"992100000001\",\"profilepic\":null,\"type\":1,\"blocked\":0,\"email_verified_at\":null,\"created_at\":\"2024-11-19T18:42:53.000000Z\",\"updated_at\":\"2024-11-19T18:42:53.000000Z\",\"company_info\":{\"company_id\":6,\"company_name\":\"Megh Malhar Dairy\",\"block_status\":0,\"logo\":\"invoice\\/105151-Untitled design (3).png\",\"sign\":\"invoice\\/130041-sign.jpg\",\"land_mark\":\"Shop No 53\",\"Tal\":\"Saswad\",\"Dist\":\"Pune\",\"pincode\":-1,\"phone_no\":\"7942679707\",\"email_id\":\"admin123@megh.com\",\"bank_name\":\"ICICI Bank\",\"account_no\":\"983492000000000\",\"IFSC_code\":\"\",\"paymentQRCode\":\"invoice\\/054140-PayTm.jpeg\",\"appMode\":\"advance\",\"subscribed_plan\":1,\"subscription_validity\":null,\"refer_by_id\":null}}]', '2025-05-24 17:44:39', NULL, '2025-05-24 15:35:05', '2025-05-24 17:44:39'),
(418, 'App\\Models\\User', 16, 'webapp', '7dabcb6d470fd3dd21c1c07d95e3d34561d03892b8fe2d4b5a50480d56bda07c', '[{\"id\":16,\"company_id\":11,\"name\":\"Owner\",\"email\":\"Owner\",\"mobile\":\"9876543111\",\"profilepic\":null,\"type\":1,\"blocked\":0,\"email_verified_at\":null,\"created_at\":\"2025-05-10T05:59:27.000000Z\",\"updated_at\":\"2025-05-10T05:59:27.000000Z\",\"company_info\":{\"company_id\":11,\"company_name\":\"Demo Milk Factory\",\"block_status\":0,\"logo\":\"invoice\\/105151-Untitled design (3).png\",\"sign\":\"invoice\\/130041-sign.jpg\",\"land_mark\":\"Demo Milk , Saswad, Pune\",\"Tal\":\"Pune\",\"Dist\":\"Pune\",\"pincode\":-1,\"phone_no\":\"9876543111\",\"email_id\":\"demomilk@gmail.com\",\"bank_name\":\"Demo Bank Pune\",\"account_no\":\"12345666\",\"IFSC_code\":\"\",\"paymentQRCode\":\"invoice\\/190124-Image (2).png\",\"appMode\":\"advance\",\"subscribed_plan\":2,\"subscription_validity\":\"2026-05-09\",\"refer_by_id\":7}}]', '2025-05-27 11:16:40', NULL, '2025-05-27 11:07:29', '2025-05-27 11:16:40'),
(265, 'App\\Models\\User', 21, 'webapp', '1c7b557f7c717bbe1be3fb9a00f0048cf980afc1adf9f826616b7075f60dbe3b', '[\"*\"]', NULL, NULL, '2025-05-14 14:59:02', '2025-05-14 14:59:02'),
(429, 'App\\Models\\User', 11, 'webapp', '3b1c4db30ed83278a9ab31b63033b73c2e0f80882cb88661b903f9caf7c6377f', '[{\"id\":11,\"company_id\":6,\"name\":\"Megh Malhar Admin\",\"email\":\"Megh Factory Owner\",\"mobile\":\"9876543210\",\"profilepic\":null,\"type\":1,\"blocked\":0,\"email_verified_at\":null,\"created_at\":\"2025-04-25T22:55:43.000000Z\",\"updated_at\":\"2025-04-25T22:55:43.000000Z\",\"company_info\":{\"company_id\":6,\"company_name\":\"Megh Malhar Dairy\",\"block_status\":0,\"logo\":\"invoice\\/105151-Untitled design (3).png\",\"sign\":\"invoice\\/130041-sign.jpg\",\"land_mark\":\"Shop No 53\",\"Tal\":\"Saswad\",\"Dist\":\"Pune\",\"pincode\":-1,\"phone_no\":\"7942679707\",\"email_id\":\"admin123@megh.com\",\"bank_name\":\"ICICI Bank\",\"account_no\":\"983492000000000\",\"IFSC_code\":\"\",\"paymentQRCode\":\"invoice\\/054140-PayTm.jpeg\",\"appMode\":\"advance\",\"subscribed_plan\":1,\"subscription_validity\":null,\"refer_by_id\":null}}]', NULL, NULL, '2025-06-19 04:05:21', '2025-06-19 04:05:21'),
(407, 'App\\Models\\User', 8, 'webapp', '4a8c66240fd0881c497ed746b7a79c3872c0d157be2f15ec304ca1fb164ef020', '[{\"id\":8,\"company_id\":6,\"name\":\"Shop Owner\",\"email\":\"admin@demo.com\",\"mobile\":\"992100000001\",\"profilepic\":null,\"type\":1,\"blocked\":0,\"email_verified_at\":null,\"created_at\":\"2024-11-19T18:42:53.000000Z\",\"updated_at\":\"2024-11-19T18:42:53.000000Z\",\"company_info\":{\"company_id\":6,\"company_name\":\"Megh Malhar Dairy\",\"block_status\":0,\"logo\":\"invoice\\/105151-Untitled design (3).png\",\"sign\":\"invoice\\/130041-sign.jpg\",\"land_mark\":\"Shop No 53\",\"Tal\":\"Saswad\",\"Dist\":\"Pune\",\"pincode\":-1,\"phone_no\":\"7942679707\",\"email_id\":\"admin123@megh.com\",\"bank_name\":\"ICICI Bank\",\"account_no\":\"983492000000000\",\"IFSC_code\":\"\",\"paymentQRCode\":\"invoice\\/054140-PayTm.jpeg\",\"appMode\":\"advance\",\"subscribed_plan\":1,\"subscription_validity\":null,\"refer_by_id\":null}}]', '2025-05-24 15:31:28', NULL, '2025-05-24 15:31:27', '2025-05-24 15:31:28'),
(417, 'App\\Models\\User', 17, 'webapp', 'd133594bbba9e607f581251e59492e62a78bb6dc5d9da5dd52243464e88a5dfd', '[{\"id\":17,\"company_id\":11,\"name\":\"Manager\",\"email\":\"Manager\",\"mobile\":\"9876543224\",\"profilepic\":null,\"type\":2,\"blocked\":0,\"email_verified_at\":null,\"created_at\":\"2025-04-25T17:26:10.000000Z\",\"updated_at\":\"2025-04-25T17:26:10.000000Z\",\"company_info\":{\"company_id\":11,\"company_name\":\"Demo Milk Factory\",\"block_status\":0,\"logo\":\"invoice\\/105151-Untitled design (3).png\",\"sign\":\"invoice\\/130041-sign.jpg\",\"land_mark\":\"Demo Milk , Saswad, Pune\",\"Tal\":\"Pune\",\"Dist\":\"Pune\",\"pincode\":-1,\"phone_no\":\"9876543111\",\"email_id\":\"demomilk@gmail.com\",\"bank_name\":\"Demo Bank Pune\",\"account_no\":\"12345666\",\"IFSC_code\":\"\",\"paymentQRCode\":\"invoice\\/190124-Image (2).png\",\"appMode\":\"advance\",\"subscribed_plan\":2,\"subscription_validity\":\"2026-05-09\",\"refer_by_id\":7}}]', '2025-05-26 17:13:59', NULL, '2025-05-26 17:13:59', '2025-05-26 17:13:59'),
(413, 'App\\Models\\User', 16, 'webapp', '1e29549b3982cc0e13d6d39822091bfda700bc49eee46059f7ae7ec65234aa23', '[{\"id\":16,\"company_id\":11,\"name\":\"Owner\",\"email\":\"Owner\",\"mobile\":\"9876543111\",\"profilepic\":null,\"type\":1,\"blocked\":0,\"email_verified_at\":null,\"created_at\":\"2025-05-10T05:59:27.000000Z\",\"updated_at\":\"2025-05-10T05:59:27.000000Z\",\"company_info\":{\"company_id\":11,\"company_name\":\"Demo Milk Factory\",\"block_status\":0,\"logo\":\"invoice\\/105151-Untitled design (3).png\",\"sign\":\"invoice\\/130041-sign.jpg\",\"land_mark\":\"Demo Milk , Saswad, Pune\",\"Tal\":\"Pune\",\"Dist\":\"Pune\",\"pincode\":-1,\"phone_no\":\"9876543111\",\"email_id\":\"demomilk@gmail.com\",\"bank_name\":\"Demo Bank Pune\",\"account_no\":\"12345666\",\"IFSC_code\":\"\",\"paymentQRCode\":\"invoice\\/190124-Image (2).png\",\"appMode\":\"advance\",\"subscribed_plan\":2,\"subscription_validity\":\"2026-05-09\",\"refer_by_id\":7}}]', '2025-05-26 11:33:49', NULL, '2025-05-24 16:42:44', '2025-05-26 11:33:49'),
(414, 'App\\Models\\User', 16, 'webapp', '2ef570d79dade6c5f27a77b9e5570cbda95fd3058ff46727ab2bdb59e2a58e9d', '[{\"id\":16,\"company_id\":11,\"name\":\"Owner\",\"email\":\"Owner\",\"mobile\":\"9876543111\",\"profilepic\":null,\"type\":1,\"blocked\":0,\"email_verified_at\":null,\"created_at\":\"2025-05-10T05:59:27.000000Z\",\"updated_at\":\"2025-05-10T05:59:27.000000Z\",\"company_info\":{\"company_id\":11,\"company_name\":\"Demo Milk Factory\",\"block_status\":0,\"logo\":\"invoice\\/105151-Untitled design (3).png\",\"sign\":\"invoice\\/130041-sign.jpg\",\"land_mark\":\"Demo Milk , Saswad, Pune\",\"Tal\":\"Pune\",\"Dist\":\"Pune\",\"pincode\":-1,\"phone_no\":\"9876543111\",\"email_id\":\"demomilk@gmail.com\",\"bank_name\":\"Demo Bank Pune\",\"account_no\":\"12345666\",\"IFSC_code\":\"\",\"paymentQRCode\":\"invoice\\/190124-Image (2).png\",\"appMode\":\"advance\",\"subscribed_plan\":2,\"subscription_validity\":\"2026-05-09\",\"refer_by_id\":7}}]', '2025-05-24 21:16:44', NULL, '2025-05-24 21:08:11', '2025-05-24 21:16:44'),
(415, 'App\\Models\\User', 16, 'webapp', '54b6d5818e810ef76fc8f1ea62399361082b26da468201b12285bbef128f599a', '[{\"id\":16,\"company_id\":11,\"name\":\"Owner\",\"email\":\"Owner\",\"mobile\":\"9876543111\",\"profilepic\":null,\"type\":1,\"blocked\":0,\"email_verified_at\":null,\"created_at\":\"2025-05-10T05:59:27.000000Z\",\"updated_at\":\"2025-05-10T05:59:27.000000Z\",\"company_info\":{\"company_id\":11,\"company_name\":\"Demo Milk Factory\",\"block_status\":0,\"logo\":\"invoice\\/105151-Untitled design (3).png\",\"sign\":\"invoice\\/130041-sign.jpg\",\"land_mark\":\"Demo Milk , Saswad, Pune\",\"Tal\":\"Pune\",\"Dist\":\"Pune\",\"pincode\":-1,\"phone_no\":\"9876543111\",\"email_id\":\"demomilk@gmail.com\",\"bank_name\":\"Demo Bank Pune\",\"account_no\":\"12345666\",\"IFSC_code\":\"\",\"paymentQRCode\":\"invoice\\/190124-Image (2).png\",\"appMode\":\"advance\",\"subscribed_plan\":2,\"subscription_validity\":\"2026-05-09\",\"refer_by_id\":7}}]', '2025-05-26 09:50:59', NULL, '2025-05-26 09:50:20', '2025-05-26 09:50:59'),
(427, 'App\\Models\\User', 11, 'webapp', '7d44786c81821448fc825251ff97b76bc750bfdb67219df728248a01d01cbd8f', '[{\"id\":11,\"company_id\":6,\"name\":\"Megh Malhar Admin\",\"email\":\"Megh Factory Owner\",\"mobile\":\"9876543210\",\"profilepic\":null,\"type\":1,\"blocked\":0,\"email_verified_at\":null,\"created_at\":\"2025-04-25T22:55:43.000000Z\",\"updated_at\":\"2025-04-25T22:55:43.000000Z\",\"company_info\":{\"company_id\":6,\"company_name\":\"Megh Malhar Dairy\",\"block_status\":0,\"logo\":\"invoice\\/105151-Untitled design (3).png\",\"sign\":\"invoice\\/130041-sign.jpg\",\"land_mark\":\"Shop No 53\",\"Tal\":\"Saswad\",\"Dist\":\"Pune\",\"pincode\":-1,\"phone_no\":\"7942679707\",\"email_id\":\"admin123@megh.com\",\"bank_name\":\"ICICI Bank\",\"account_no\":\"983492000000000\",\"IFSC_code\":\"\",\"paymentQRCode\":\"invoice\\/054140-PayTm.jpeg\",\"appMode\":\"advance\",\"subscribed_plan\":1,\"subscription_validity\":null,\"refer_by_id\":null}}]', '2025-06-11 09:23:01', NULL, '2025-06-08 06:11:28', '2025-06-11 09:23:01'),
(428, 'App\\Models\\User', 11, 'webapp', 'f702334506ca8042c60682e678e2f63dd616e509530b6f4bb56ba796e1de482f', '[{\"id\":11,\"company_id\":6,\"name\":\"Megh Malhar Admin\",\"email\":\"Megh Factory Owner\",\"mobile\":\"9876543210\",\"profilepic\":null,\"type\":1,\"blocked\":0,\"email_verified_at\":null,\"created_at\":\"2025-04-25T22:55:43.000000Z\",\"updated_at\":\"2025-04-25T22:55:43.000000Z\",\"company_info\":{\"company_id\":6,\"company_name\":\"Megh Malhar Dairy\",\"block_status\":0,\"logo\":\"invoice\\/105151-Untitled design (3).png\",\"sign\":\"invoice\\/130041-sign.jpg\",\"land_mark\":\"Shop No 53\",\"Tal\":\"Saswad\",\"Dist\":\"Pune\",\"pincode\":-1,\"phone_no\":\"7942679707\",\"email_id\":\"admin123@megh.com\",\"bank_name\":\"ICICI Bank\",\"account_no\":\"983492000000000\",\"IFSC_code\":\"\",\"paymentQRCode\":\"invoice\\/054140-PayTm.jpeg\",\"appMode\":\"advance\",\"subscribed_plan\":1,\"subscription_validity\":null,\"refer_by_id\":null}}]', '2025-07-02 09:22:10', NULL, '2025-06-12 12:13:56', '2025-07-02 09:22:10'),
(430, 'App\\Models\\User', 11, 'webapp', '77aee328a40857a8d3e65d3424a8e65b9cfd6af27675d93d7fae5908b467a88e', '[{\"id\":11,\"company_id\":6,\"name\":\"Megh Malhar Admin\",\"email\":\"Megh Factory Owner\",\"mobile\":\"9876543210\",\"profilepic\":null,\"type\":1,\"blocked\":0,\"email_verified_at\":null,\"created_at\":\"2025-04-25T22:55:43.000000Z\",\"updated_at\":\"2025-04-25T22:55:43.000000Z\",\"company_info\":{\"company_id\":6,\"company_name\":\"Megh Malhar Dairy\",\"block_status\":0,\"logo\":\"invoice\\/105151-Untitled design (3).png\",\"sign\":\"invoice\\/130041-sign.jpg\",\"land_mark\":\"Shop No 53\",\"Tal\":\"Saswad\",\"Dist\":\"Pune\",\"pincode\":-1,\"phone_no\":\"7942679707\",\"email_id\":\"admin123@megh.com\",\"bank_name\":\"ICICI Bank\",\"account_no\":\"983492000000000\",\"IFSC_code\":\"\",\"paymentQRCode\":\"invoice\\/054140-PayTm.jpeg\",\"appMode\":\"advance\",\"subscribed_plan\":1,\"subscription_validity\":null,\"refer_by_id\":null}}]', NULL, NULL, '2025-06-19 04:42:32', '2025-06-19 04:42:32');

-- --------------------------------------------------------

--
-- Table structure for table `plans`
--

DROP TABLE IF EXISTS `plans`;
CREATE TABLE IF NOT EXISTS `plans` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `price` double NOT NULL DEFAULT '0',
  `userLimit` int NOT NULL DEFAULT '0',
  `accessLevel` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `plans`
--

INSERT INTO `plans` (`id`, `name`, `description`, `price`, `userLimit`, `accessLevel`, `isActive`, `created_at`, `updated_at`) VALUES
(2, 'Standard Plan', 'Standard Plan', 1200, 100, 1, 1, '2025-04-28 04:07:39', '2025-04-28 04:07:39'),
(3, 'Gold Plan', 'Gold Plan', 2000, 100, 1, 1, '2025-04-28 23:22:57', '2025-04-28 23:22:57');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
CREATE TABLE IF NOT EXISTS `products` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `payload` longtext NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('oGXz790xcSo8BQqAOOM2xi4c3uWwiqKqAzGS8uGc', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiaUZ5ajdOYzdsZEVEbVlDamZEbzFLOXBIQUU0OXRkTE9yRjlNOVo4dyI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMCI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=', 1751448130);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `mobile` varchar(255) NOT NULL,
  `profilepic` varchar(255) DEFAULT NULL,
  `type` int NOT NULL DEFAULT '0',
  `blocked` tinyint(1) NOT NULL DEFAULT '0',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_mobile_unique` (`mobile`),
  KEY `users_company_id_foreign` (`company_id`)
) ENGINE=MyISAM AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `company_id`, `name`, `email`, `mobile`, `profilepic`, `type`, `blocked`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`) VALUES
(10, 10, 'simpleadmin@demo.com', 'simpleadmin@demo.com', '9', NULL, 1, 0, NULL, '$2y$12$7zEfHDiRPVB8DERnZqGne.gpoYs5tNGBOW7De92cS/bm5utuwA5i6', NULL, '2024-11-30 10:18:08', '2024-11-30 10:18:08'),
(9, 6, 'Delivery Boy', 'delivery@demo.com', '992100000002', NULL, 2, 0, NULL, '$2y$12$Z5RDoGIeFSzyulyEMD9P8eJmxmw8GAt.lykA7F7KQYkd1mzaGCna.', NULL, '2024-11-20 00:13:13', '2024-12-18 23:54:34'),
(8, 6, 'Shop Owner', 'admin@demo.com', '992100000001', NULL, 1, 0, NULL, '$2y$12$iVmHlFYBZIvwjy8QwFGnkO8QQvP58TJSo/i/qeelNjrH6jeMCgoD6', NULL, '2024-11-20 00:12:53', '2024-11-20 00:12:53'),
(7, 4, 'Tipic', 'admin@tipic.co.in', '9900000000', NULL, 0, 0, NULL, '$2y$12$l6q/hUjKkjVkoBGpJJnhfORAd9zE.Uqx8vMml4eWs4NyxK3dlQpyq', NULL, '2024-11-17 07:31:56', '2024-11-27 08:09:34'),
(11, 6, 'Megh Malhar Admin', 'Megh Factory Owner', '9876543210', NULL, 1, 0, NULL, '$2y$12$7zEfHDiRPVB8DERnZqGne.gpoYs5tNGBOW7De92cS/bm5utuwA5i6', NULL, '2025-04-25 22:55:43', '2025-04-25 22:55:43'),
(12, 6, 'Megh Malhar Manager', 'Megh Factory Manager', '9876543211', NULL, 2, 0, NULL, '$2y$12$IrKIGocGKHF5XKloke/6N.OCL/AfBF5Va7TT3GhcRFqRNy3wkz7YO', NULL, '2025-04-25 22:56:10', '2025-04-25 22:56:10'),
(13, 6, 'Megh Malhar Production Engineer', 'Megh Production Enginee', '9876543212', NULL, 3, 0, NULL, '$2y$12$IqZFXWsZMVC9X0/4.H3MrO2h0XUItrIi0s4oUKOh8hl5TYZTqnkvS', NULL, '2025-04-25 22:56:32', '2025-04-25 22:56:32'),
(14, 6, 'Megh Malhar Delivery Team', 'Megh Delivery Partner', '9876543213', NULL, 4, 0, NULL, '$2y$12$l6q/hUjKkjVkoBGpJJnhfORAd9zE.Uqx8vMml4eWs4NyxK3dlQpyq', NULL, '2025-04-25 22:56:56', '2025-04-25 22:56:56'),
(15, 6, 'Megh Malhar Laboratory Technician', 'Megh Lab Technician', '9876543214', NULL, 5, 0, NULL, '$2y$12$xlwbrIVuvFy0Yv573StbLeJn7VihGjUC3qJOwAIDoVHSUhESOUUdm', NULL, '2025-04-25 22:57:18', '2025-04-25 22:57:18'),
(16, 11, 'Owner', 'Owner', '9876543111', NULL, 1, 0, NULL, '$2y$12$i4ZKXotGrZm/F7JNG06EzuC2Sit.mKBnsf5Ub0ER2.v9fpmRn8ga.', NULL, '2025-05-10 11:29:27', '2025-05-10 11:29:27'),
(17, 11, 'Manager', 'Manager', '9876543224', NULL, 2, 0, NULL, '$2y$12$IrKIGocGKHF5XKloke/6N.OCL/AfBF5Va7TT3GhcRFqRNy3wkz7YO', NULL, '2025-04-25 22:56:10', '2025-04-25 22:56:10'),
(18, 11, 'Production Engineer', 'Production Engineer', '9876543223', NULL, 3, 0, NULL, '$2y$12$IqZFXWsZMVC9X0/4.H3MrO2h0XUItrIi0s4oUKOh8hl5TYZTqnkvS', NULL, '2025-04-25 22:56:32', '2025-04-25 22:56:32'),
(19, 11, 'Delivery Team', 'Delivery Partner', '9876543222', NULL, 4, 0, NULL, '$2y$12$l6q/hUjKkjVkoBGpJJnhfORAd9zE.Uqx8vMml4eWs4NyxK3dlQpyq', NULL, '2025-04-25 22:56:56', '2025-04-25 22:56:56'),
(20, 11, 'Factory Laboratory Technician', 'Lab Technician', '9876543221', NULL, 5, 0, NULL, '$2y$12$xlwbrIVuvFy0Yv573StbLeJn7VihGjUC3qJOwAIDoVHSUhESOUUdm', NULL, '2025-04-25 22:57:18', '2025-04-25 22:57:18'),
(21, 6, 'shubham', 'th12@gmail.com', '+919146669462', NULL, 2, 1, NULL, '$2y$12$1cKkk8lR.bpmgDPOsPr/CeXuFCAhC0WwqpFxjZcZC29mwWn63yx/K', NULL, '2025-05-14 14:59:02', '2025-05-14 15:02:38'),
(22, 12, 'Shop Owner', 'demo-owner@gmail.com', '7766628182', NULL, 1, 0, NULL, '$2y$12$M0q91YMR/vMqs34DLzpdquHiPeIJN8OJr4Ay3gOIuQe4ssNnu/PJa', NULL, '2025-05-24 02:39:28', '2025-05-24 02:39:28');

--
-- Constraints for dumped tables
--

--
-- Constraints for table `company_receipts`
--
ALTER TABLE `company_receipts`
  ADD CONSTRAINT `company_receipts_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `company_info` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `employee`
--
ALTER TABLE `employee`
  ADD CONSTRAINT `employee_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `company_info` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `employee_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `employee_details`
--
ALTER TABLE `employee_details`
  ADD CONSTRAINT `employee_details_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `company_info` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `employee_details_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `employee_details_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `employee_tracker`
--
ALTER TABLE `employee_tracker`
  ADD CONSTRAINT `employee_tracker_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `company_info` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `employee_tracker_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `employee_tracker_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `employee_transaction`
--
ALTER TABLE `employee_transaction`
  ADD CONSTRAINT `employee_transaction_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `company_info` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `employee_transaction_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `employee_transaction_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
