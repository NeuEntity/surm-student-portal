import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoginForm from "@/components/login/login-form";

export default async function LoginPage() {
  // IMPORTANT: Do NOT redirect from the page component
  // Let the middleware handle all redirects to prevent race conditions and loops
  // The middleware will redirect authenticated users away from /login
  // This page should only render the login form

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surm-paper)] p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white shadow-lg overflow-hidden">
          <div className="bg-[var(--surm-green)] p-4 sm:p-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-white mb-2">
              SURM Student Portal
            </h1>
            <p className="text-xs sm:text-sm text-white/90 font-sans">
              Enter your credentials to access your account
            </p>
          </div>
          <div className="p-4 sm:p-6">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
