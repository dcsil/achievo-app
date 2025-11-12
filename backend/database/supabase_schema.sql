-- Achievo Supabase (PostgreSQL) Schema
-- Target: PostgreSQL 15+ (Supabase)
-- Safe to run multiple times (uses IF NOT EXISTS)

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone (optional)
SET timezone = 'UTC';

-- Drop tables in reverse order of dependencies (if you need to recreate)
-- Uncomment these lines if you want to reset the database
-- DROP TABLE IF EXISTS user_blind_boxes CASCADE;
-- DROP TABLE IF EXISTS tasks CASCADE;
-- DROP TABLE IF EXISTS blind_box_figures CASCADE;
-- DROP TABLE IF EXISTS blind_box_series CASCADE;
-- DROP TABLE IF EXISTS assignments CASCADE;
-- DROP TABLE IF EXISTS courses CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- TABLES
-- ============================================================================

-- 1) users: stores student accounts and gamification state
CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(50) PRIMARY KEY,
  canvas_username VARCHAR(255),
  total_points INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2) courses
CREATE TABLE IF NOT EXISTS courses (
  course_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  course_code VARCHAR(50),
  canvas_course_id VARCHAR(100),
  date_imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  term VARCHAR(50),
  color VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_courses_user FOREIGN KEY (user_id) 
    REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3) assignments
CREATE TABLE IF NOT EXISTS assignments (
  assignment_id VARCHAR(50) PRIMARY KEY,
  course_id VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completion_points INTEGER NOT NULL DEFAULT 0,
  is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_assignments_course FOREIGN KEY (course_id) 
    REFERENCES courses(course_id) ON DELETE CASCADE
);

-- 4) blind_box_series
CREATE TABLE IF NOT EXISTS blind_box_series (
  series_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  cost_points INTEGER NOT NULL DEFAULT 0,
  release_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5) blind_box_figures
CREATE TABLE IF NOT EXISTS blind_box_figures (
  figure_id VARCHAR(50) PRIMARY KEY,
  series_id VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  rarity VARCHAR(50),
  weight DOUBLE PRECISION DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_figures_series FOREIGN KEY (series_id) 
    REFERENCES blind_box_series(series_id) ON DELETE CASCADE
);

-- 6) tasks
CREATE TABLE IF NOT EXISTS tasks (
  task_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  assignment_id VARCHAR(50),
  course_id VARCHAR(50),
  description TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  scheduled_start_at TIMESTAMP WITH TIME ZONE,
  scheduled_end_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completion_date_at TIMESTAMP WITH TIME ZONE,
  reward_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) 
    REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_assignment FOREIGN KEY (assignment_id) 
    REFERENCES assignments(assignment_id) ON DELETE SET NULL,
  CONSTRAINT fk_tasks_course FOREIGN KEY (course_id) 
    REFERENCES courses(course_id) ON DELETE SET NULL
);

-- 7) user_blind_boxes
CREATE TABLE IF NOT EXISTS user_blind_boxes (
  purchase_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  series_id VARCHAR(50) NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  opened_at TIMESTAMP WITH TIME ZONE,
  awarded_figure_id VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ubb_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_ubb_series FOREIGN KEY (series_id)
    REFERENCES blind_box_series(series_id) ON DELETE CASCADE,
  CONSTRAINT fk_ubb_figure FOREIGN KEY (awarded_figure_id)
    REFERENCES blind_box_figures(figure_id) ON DELETE SET NULL
);
