import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
const PUBLIC_PATHS = ["/login", "/_next", "/favicon.ico"];
const AUTH_COOKIE_NAME =
  process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME || "auth_token";

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (isPublic) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

  // Apenas checa presenca do cookie; validacao real ocorre no backend.
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
 
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
