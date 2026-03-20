import { redirect } from 'next/navigation';

export default function RootPage() {
  // Permanently redirect any requests to the root path to the login page.
  // This is the recommended approach for handling root redirects in Next.js App Router.
  redirect('/login');
}
