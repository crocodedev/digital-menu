// lib/supabaseClient.ts

import {createClient} from '@supabase/supabase-js'

// const url = 'https://qrzedqqkvfuxqbaqjqrv.supabase.co'
// const anon =
// 	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyemVkcXFrdmZ1eHFiYXFqcXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMDY4NjEsImV4cCI6MjA3NDc4Mjg2MX0.m-3zxAgscum4HymiRsa8wRIuRnSyjKixt3BepRGnwvU'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, anon)
