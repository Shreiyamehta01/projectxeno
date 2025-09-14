
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get('shop');
  if (!shop) {
    return NextResponse.redirect('/connect?error=missing_shop');
  }

  // Build the Shopify OAuth URL
  const clientId = process.env.SHOPIFY_API_KEY;
  const redirectUri = (
    `${process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'}/api/auth/callback/shopify`
  );
  console.log(redirectUri)
  const scopes = 'read_orders,read_customers,read_products,write_orders,write_customers,write_products';
  const state = Math.random().toString(36).substring(2); // You should store this in a cookie/session for CSRF protection

  const shopifyAuthUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}&grant_options[]=per-user`;

  return NextResponse.redirect(shopifyAuthUrl);
}

