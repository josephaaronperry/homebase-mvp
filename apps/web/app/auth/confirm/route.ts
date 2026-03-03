import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';
  const origin = requestUrl.origin;

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/login?error=missing_token`);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(`${origin}/login?error=config`);
  }

  const redirectResponse = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const cookieHeader = request.headers.get('cookie');
        if (!cookieHeader) return [];
        return cookieHeader.split(';').map((c) => {
          const eq = c.trim().indexOf('=');
          const name = eq > 0 ? c.trim().slice(0, eq).trim() : '';
          const value = eq > 0 ? c.trim().slice(eq + 1).trim() : '';
          return { name, value };
        });
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          redirectResponse.cookies.set(name, value, (options ?? {}) as { path?: string; maxAge?: number; httpOnly?: boolean; secure?: boolean; sameSite?: 'lax' | 'strict' | 'none' });
        });
      },
    },
  });

  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    type: type as 'email' | 'magiclink' | 'recovery',
  });

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=confirm_error`);
  }

  return redirectResponse;
}
