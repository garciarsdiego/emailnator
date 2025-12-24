-- Add variations column to campaigns table to store all generated options
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS variations jsonb DEFAULT NULL;

-- This column will store:
-- {
--   "subjects": ["option1", "option2", ...],
--   "subjectsResend": ["option1", "option2", ...],
--   "preheaders": ["option1", "option2", ...],
--   "ctas": ["option1", "option2", ...],
--   "tips": ["tip1", "tip2", ...]
-- }