
-- Add tags column to the entries table if it doesn't exist
ALTER TABLE public.entries 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT NULL;
