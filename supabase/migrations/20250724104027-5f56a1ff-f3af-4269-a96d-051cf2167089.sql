-- Convert date column from text to proper date type
-- Step 1: Add a new temporary date column
ALTER TABLE public.entries ADD COLUMN date_new DATE;

-- Step 2: Convert existing text dates to proper dates
-- Handle different date formats that exist in the data
UPDATE public.entries 
SET date_new = CASE 
  -- Handle format like "February 17, 2025"
  WHEN date ~ '^[A-Za-z]+ \d{1,2}, \d{4}$' THEN 
    TO_DATE(date, 'Month DD, YYYY')
  -- Handle format like "04/03/2025" (MM/DD/YYYY)
  WHEN date ~ '^\d{2}/\d{2}/\d{4}$' THEN 
    TO_DATE(date, 'MM/DD/YYYY')
  -- Handle format like "2025-03-19" (ISO format)
  WHEN date ~ '^\d{4}-\d{2}-\d{2}$' THEN 
    TO_DATE(date, 'YYYY-MM-DD')
  -- Default fallback - try to parse as timestamp and extract date
  ELSE 
    COALESCE(TO_DATE(date, 'YYYY-MM-DD'), CURRENT_DATE)
END;

-- Step 3: Drop the old text column
ALTER TABLE public.entries DROP COLUMN date;

-- Step 4: Rename the new column to the original name
ALTER TABLE public.entries RENAME COLUMN date_new TO date;

-- Step 5: Set the new date column as NOT NULL with a default
ALTER TABLE public.entries ALTER COLUMN date SET NOT NULL;
ALTER TABLE public.entries ALTER COLUMN date SET DEFAULT CURRENT_DATE;

-- Add an index on the date column for better sorting performance
CREATE INDEX IF NOT EXISTS idx_entries_date ON public.entries(date DESC);