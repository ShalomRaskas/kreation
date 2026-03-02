-- Add new onboarding fields to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS intro TEXT,
  ADD COLUMN IF NOT EXISTS writing_samples TEXT,
  ADD COLUMN IF NOT EXISTS content_topic TEXT;

-- platform column already exists from 001_profiles.sql
-- niche, personality, audience, style are kept for backward compat but no longer used
