import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isShowcase } from "@/lib/site-mode";

const PROTECTED = ["/dashboard", "/onboarding", "/admin"];

export async function proxy(request: NextRequest) {
  // Showcase mode: website and demo only. Account pages go to the demo or contact page.
  if (isShowcase()) {
    const path = request.nextUrl.pathname;
    if (/^\/(dashboard|admin)(\/|$)/.test(path)) return NextResponse.redirect(new URL("/demo", request.url));
    if (/^\/(login|register|forgot-password|reset-password|check-email|onboarding|invite|setup-required)(\/|$)/.test(path)) return NextResponse.redirect(new URL("/contact", request.url));
    return NextResponse.next();
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isProtected = PROTECTED.some((p) => request.nextUrl.pathname.startsWith(p));
  if (!url || !key) {
    if (isProtected) return NextResponse.redirect(new URL("/setup-required", request.url));
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  let userId: string | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    userId = null;
  }

  if (isProtected && !userId) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|l/|api/stripe/webhook|.*\\.(?:png|jpg|svg|webp|ico)$).*)"],
};
