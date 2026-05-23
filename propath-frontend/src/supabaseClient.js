// src/supabaseClient.js
// Install: npm install @supabase/supabase-js

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://awgtvyjvfdvjikszdxzt.supabase.co"       // ← replace
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3Z3R2eWp2ZmR2amlrc3pkeHp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1Mzc0NzYsImV4cCI6MjA5NTExMzQ3Nn0.NUD-OW_9QEk9ENE0PuDkJqIqNr2-SzQ-G2DkmZ-bLJw"                 // ← replace

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
