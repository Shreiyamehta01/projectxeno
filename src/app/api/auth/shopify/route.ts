import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { currentUser } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// Function to register webhooks with Shopify
async function registerWebhooks(shop: string, accessToken: string) {
  const webhookUrl = `${process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'}/api/webhooks/orders-create`;
  
  try {
    // Register orders/create webhook
    const webhookResponse = await fetch(`https://${shop}/admin/api/2024-07/webhooks.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook: {
          topic: 'orders/create',
          address: webhookUrl,
          format: 'json'
        }
      })
    });

    if (webhookResponse.ok) {
      console.log(`Webhook registered successfully for ${shop}`);
    } else {
      console.error(`Failed to register webhook for ${shop}:`, await webhookResponse.text());
    }
  } catch (error) {
    console.error(`Error registering webhook for ${shop}:`, error);
  }
}

export async function GET(request: Request) {
  try {
    // 1. Get the current user from Clerk
    const user = await currentUser();

    // 2. Ensure a user is logged into our app before connecting a store.
    if (!user?.id) {
      console.error('CRITICAL: User not authenticated during Shopify callback.');
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'}/login?error=unauthenticated`);
    }
    const userId = user.id;

    // 3. Parse parameters from the Shopify redirect.
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');
    const code = searchParams.get('code');
    // You should also validate the 'state' parameter against a stored value for security.

    if (!shop || !code) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'}/connect?error=missing_params`);
    }

    // 4. Exchange the temporary authorization code for a permanent access token.
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      }),
    });

    if (!tokenResponse.ok) {
        throw new Error(`Shopify token exchange failed: ${await tokenResponse.text()}`);
    }

    const { access_token } = await tokenResponse.json();

    // 5. Use `upsert` to create a new store or update an existing one.
    // This correctly links the store to the currently logged-in user.
    await prisma.store.upsert({
        where: { shop }, // Find the store by its unique shop domain.
        update: { accessToken: access_token, userId: userId }, // If it exists, update its token and owner.
        create: {
            shop: shop,
            accessToken: access_token,
            userId: userId, // Link to the logged-in user.
        }
    });

    console.log(`Store '${shop}' connected successfully for user ID: ${userId}`);
    
    // 6. Register webhooks with Shopify
    await registerWebhooks(shop, access_token);

    // 7. Redirect to the dashboard upon success.
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'}/dashboard?connected=true`);

  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'}/connect?error=${encodeURIComponent(errorMessage)}`);
  }
}

