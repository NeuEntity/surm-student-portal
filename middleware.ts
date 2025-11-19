import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Helper function to validate and get user from token
async function getUserFromToken(req: NextRequest, pathname?: string): Promise<any | null> {
  try {
    if (!process.env.NEXTAUTH_SECRET) {
      console.warn("Middleware: NEXTAUTH_SECRET not set, treating as unauthenticated");
      return null;
    }

    // Get token - NextAuth v5 (Auth.js) uses different cookie names
    // Production: __Secure-authjs.session-token
    // Development: authjs.session-token
    let token = null;
    const cookieHeader = req.headers.get("cookie") || "";
    const isProduction = process.env.NODE_ENV === 'production' || req.url.includes('railway.app');
    
    // Try to get token with explicit cookie name for NextAuth v5
    try {
      // NextAuth v5 (Auth.js) uses __Secure-authjs.session-token in production
      // Try different cookie name formats
      const cookieNames = [
        '__Secure-authjs.session-token',  // Production format (double underscore)
        'authjs.session-token',           // Development format
        'next-auth.session-token',        // Legacy format
      ];
      
      for (const cookieName of cookieNames) {
        try {
          token = await getToken({ 
            req, 
            secret: process.env.NEXTAUTH_SECRET,
            cookieName: cookieName
          });
          if (token) {
            console.log(`[Middleware] Successfully read token from cookie: ${cookieName}`);
            break;
          }
        } catch (err) {
          // Try next cookie name
          continue;
        }
      }
      
      // Final fallback: let getToken auto-detect (no cookieName specified)
      if (!token) {
        token = await getToken({ 
          req, 
          secret: process.env.NEXTAUTH_SECRET
        });
      }
    } catch (tokenError) {
      console.error("[Middleware] Error getting token:", tokenError);
    }
    
    // Debug logging (remove in production if too verbose)
    if (pathname && (pathname.startsWith("/dashboard") || pathname.startsWith("/login"))) {
      const hasSessionCookie = cookieHeader.includes("session-token") || 
                               cookieHeader.includes("authjs.session") ||
                               cookieHeader.includes("_Secure-authjs");
      const allCookies = cookieHeader.split(";").map(c => c.trim().split("=")[0]);
      console.log(`[Middleware] ${pathname}: token=${!!token}, hasCookie=${hasSessionCookie}, cookies=[${allCookies.join(", ")}], tokenSub=${token ? (token as any).sub : 'none'}, tokenRole=${token ? (token as any).role : 'none'}`);
      
      // If we have cookies but no token, log the cookie names for debugging
      if (hasSessionCookie && !token) {
        console.warn(`[Middleware] Cookies present but token is null. Cookie header: ${cookieHeader.substring(0, 200)}...`);
      }
    }
    
    // CRITICAL: Only treat as authenticated if token exists AND has ALL required fields
    // This prevents issues with stale/invalid cookies that have partial data
    if (token && (token as any).sub && (token as any).role) {
      // Validate role is a valid value
      const role = (token as any).role;
      if (typeof role === 'string' && ['STUDENT', 'TEACHER', 'ADMIN'].includes(role)) {
        return token as any;
      } else {
        // Invalid role - treat as unauthenticated
        console.warn("Middleware: Token has invalid role, treating as unauthenticated");
        return null;
      }
    } else {
      // Token missing required fields - treat as unauthenticated
      if (token && !(token as any).role) {
        console.warn("Middleware: Token missing role, treating as unauthenticated");
      }
      return null;
    }
  } catch (error) {
    // If token retrieval fails (e.g., invalid secret, malformed token), treat as unauthenticated
    console.error("Middleware: Failed to get token:", error);
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Allow access to auth routes and static files
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // Handle login page separately - redirect authenticated users away
  if (pathname.startsWith("/login")) {
    const user = await getUserFromToken(req, pathname);
    
    // If authenticated, redirect to dashboard (middleware will route to role-specific page)
    if (user) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // If not authenticated, allow access to login page
    return NextResponse.next();
  }

  // Get user from token for all other routes
  const user = await getUserFromToken(req, pathname);

  // Redirect to login if not authenticated and trying to access protected routes
  if (!user && pathname.startsWith("/dashboard")) {
    const response = NextResponse.redirect(new URL("/login", req.url));
    // Clear any potentially invalid session cookies to prevent loops
    // This helps when there are stale cookies that can't be properly validated
    response.cookies.delete("next-auth.session-token");
    response.cookies.delete("__Secure-next-auth.session-token");
    response.cookies.delete("authjs.session-token");
    response.cookies.delete("__Secure-authjs.session-token");
    return response;
  }

  // Redirect authenticated users from root to dashboard
  if (user && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Route authenticated users from /dashboard to their role-specific dashboard
  if (user && pathname === "/dashboard") {
    if (user.role === "STUDENT") {
      const level = user.level?.toLowerCase().replace("_", "-");
      if (level) {
        return NextResponse.redirect(new URL(`/dashboard/${level}`, req.url));
      }
      // If student has no level, redirect to login
      return NextResponse.redirect(new URL("/login", req.url));
    } else if (user.role === "TEACHER") {
      return NextResponse.redirect(new URL("/dashboard/teacher", req.url));
    } else if (user.role === "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    }
    // Unknown role, redirect to login
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Prevent students from accessing other levels
  if (user && user.role === "STUDENT" && pathname.startsWith("/dashboard/")) {
    const userLevel = user.level?.toLowerCase().replace("_", "-");
    const requestedPath = pathname.split("/")[2];
    
    // Allow access only to their level or non-level paths like /dashboard/api
    if (
      requestedPath &&
      requestedPath.startsWith("secondary-") &&
      requestedPath !== userLevel
    ) {
      return NextResponse.redirect(new URL(`/dashboard/${userLevel}`, req.url));
    }
  }

  // Prevent non-teachers from accessing teacher dashboard
  if (pathname.startsWith("/dashboard/teacher")) {
    if (!user || user.role !== "TEACHER") {
      // If not authenticated, redirect to login
      if (!user) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      // If authenticated but wrong role, redirect to their appropriate dashboard
      // Avoid redirecting back to /dashboard to prevent loops
      if (user.role === "STUDENT") {
        const level = user.level?.toLowerCase().replace("_", "-");
        if (level) {
          return NextResponse.redirect(new URL(`/dashboard/${level}`, req.url));
        }
      } else if (user.role === "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard/admin", req.url));
      }
      // Fallback to login if role is unknown
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Prevent non-admins from accessing admin dashboard
  if (pathname.startsWith("/dashboard/admin")) {
    if (!user || user.role !== "ADMIN") {
      // If not authenticated, redirect to login
      if (!user) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      // If authenticated but wrong role, redirect to their appropriate dashboard
      // Avoid redirecting back to /dashboard to prevent loops
      if (user.role === "STUDENT") {
        const level = user.level?.toLowerCase().replace("_", "-");
        if (level) {
          return NextResponse.redirect(new URL(`/dashboard/${level}`, req.url));
        }
      } else if (user.role === "TEACHER") {
        return NextResponse.redirect(new URL("/dashboard/teacher", req.url));
      }
      // Fallback to login if role is unknown
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

