import {createClient} from '@supabase/supabase-js'

const url = 'https://qrzedqqkvfuxqbaqjqrv.supabase.co'
const anon =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyemVkcXFrdmZ1eHFiYXFqcXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMDY4NjEsImV4cCI6MjA3NDc4Mjg2MX0.m-3zxAgscum4HymiRsa8wRIuRnSyjKixt3BepRGnwvU'

export const supabase = createClient(url, anon)
