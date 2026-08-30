import { redirect } from 'next/navigation'

// The AI Console now lives inside the SuperAdmin-only Admin panel (/admin → "AI Console" tab).
// Keep this route as a redirect so any old link / bookmark lands in the right place.
export default function ConsolePage() {
  redirect('/admin')
}
