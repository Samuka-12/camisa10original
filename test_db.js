import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kffjkhyhhjpkwzfrcvzh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'ey...'; // I will just read the .env file

console.log("Reading from Supabase...");
