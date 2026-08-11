// When someone opens clausio.com → go straight to dashboard
import { redirect } from 'next/navigation'
export default function Home() {
  redirect('/dashboard')
}
