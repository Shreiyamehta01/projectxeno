import NextAuth from 'next-auth';
import { identityOptions } from '@/lib/auth';

const handler = NextAuth(identityOptions);

export { handler as GET, handler as POST };
