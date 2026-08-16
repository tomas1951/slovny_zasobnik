import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (pathname.startsWith("/contribute") && !req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
});

export const config = { matcher: ["/contribute/:path*", "/admin/:path*"] };
