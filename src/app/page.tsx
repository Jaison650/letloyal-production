import { redirect } from 'next/navigation';

// Root URL → merchant login.
// Merchants bookmark /merchant/login after onboarding.
export default function Home() {
  redirect('/merchant/login');
}
