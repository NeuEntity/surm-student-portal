import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true, // Trust the host header (required for Railway/production)
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirect errors back to login page
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          console.log("=== AUTH START ===");
          console.log("Credentials received:", { email: credentials?.email ? "present" : "missing", password: credentials?.password ? "present" : "missing" });
          
          // NextAuth expects null on failure
          if (!credentials?.email || !credentials?.password) {
            console.error("❌ Missing credentials");
            return null;
          }

          // Ensure email and password are strings
          const email = String(credentials.email);
          const password = String(credentials.password);

          console.log("🔐 Attempting to authenticate:", email);

          // Lazy-load authorizeUser to avoid bundling Prisma into middleware
          // Use dynamic import to prevent Prisma from being bundled in Edge Runtime
          // The @ alias should work, but if not, this will catch the error
          let authorizeUser;
          try {
            authorizeUser = (await import("@/lib/authorize")).authorizeUser;
            console.log("✅ authorizeUser imported successfully");
          } catch (importError) {
            console.error("❌ Failed to import authorizeUser:", importError);
            return null;
          }
          
          // call your own function that talks to Prisma/bcrypt
          let user;
          try {
            user = await authorizeUser({
              email,
              password,
            });
          } catch (authError) {
            console.error("❌ Error in authorizeUser:", authError);
            return null;
          }

          if (!user) {
            console.error("❌ Authentication failed: User not found or invalid password for:", email);
            return null;
          }

          console.log("✅ Authentication successful for user:", user.id, user.email, user.role);
          console.log("=== AUTH END ===");
          return user;
        } catch (error) {
          // Log error for debugging but don't expose it to the user
          console.error("❌ Authentication error:", error);
          if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
          }
          // Return null to indicate authentication failure
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id; // Set the subject (user ID) in the token
        token.id = user.id; // Also store it as id for easy access
        token.role = (user as any).role;
        token.level = (user as any).level;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub || token.id; // Use sub (standard) or fallback to id
        (session.user as any).role = token.role;
        (session.user as any).level = token.level;
      }
      return session;
    },
  },
});

