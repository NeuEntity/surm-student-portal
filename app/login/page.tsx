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
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-[var(--surm-beige)] rounded-lg">
              <p className="text-xs sm:text-sm font-semibold text-[var(--surm-text-dark)] mb-2 font-sans">Demo Accounts:</p>
              <div className="text-xs text-[var(--surm-text-dark)]/80 space-y-2 font-sans">
                <div>
                  <p className="font-semibold">Students:</p>
                  <p className="break-words">Sec 1: student1@surm.edu</p>
                  <p className="break-words">Sec 2: student2@surm.edu</p>
                  <p className="break-words">Sec 3: student3@surm.edu</p>
                  <p className="break-words">Sec 4: student4@surm.edu</p>
                </div>
                <div>
                  <p className="font-semibold">Teachers:</p>
                  <p className="break-words">Multi-Role: teacher@surm.edu</p>
                  <p className="break-words">Form Only: teacher.form@surm.edu</p>
                  <p className="break-words">Tahfiz Only: teacher.tahfiz@surm.edu</p>
                  <p className="break-words">Subject Only: teacher.subject@surm.edu</p>
                  <p className="break-words">Principal: principal@surm.edu.sg</p>
                </div>
                <div>
                  <p className="font-semibold">Admin:</p>
                  <p className="break-words">admin@surm.edu.sg</p>
                </div>
                <p className="mt-2 font-semibold border-t border-[var(--surm-text-dark)]/10 pt-2">Password for all: password123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
