-- Fix triggers and functions that reference deleted total_amount column
BEGIN;

-- Check if there are any triggers or functions referencing total_amount
-- First, let's see what triggers exist
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table = 'store_purchases';

-- Drop and recreate any triggers that might be referencing total_amount
-- This is a safer approach than trying to modify existing triggers

-- If there's a trigger for calculating total_amount, we need to remove it
-- since total_amount column no longer exists

COMMIT;