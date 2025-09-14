import { redirect } from 'next/navigation';

export default function HomePortal() {
  // HomePortal: Automatically redirects users based on authentication state
  // who lands on the homepage to the /login page.
  redirect('/login');

  // Since redirect() is called, this part will never be rendered.
  // We can return null or an empty fragment.
  return null;
}
