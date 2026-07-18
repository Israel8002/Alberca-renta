import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
  const devEnabled = process.env.ALLOW_DEV_LOGIN === "true";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-500 via-sky-600 to-cyan-700 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-slate-900">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-3xl dark:bg-sky-900/40">
            🏊
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Alberca de Eventos
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Panel de administración
          </p>
        </div>
        <LoginForm googleEnabled={googleEnabled} devEnabled={devEnabled} />
        {!googleEnabled && !devEnabled && (
          <p className="mt-6 rounded-lg bg-amber-50 p-3 text-center text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            No hay métodos de acceso configurados. Define GOOGLE_CLIENT_ID /
            GOOGLE_CLIENT_SECRET o ALLOW_DEV_LOGIN=true.
          </p>
        )}
      </div>
    </div>
  );
}
