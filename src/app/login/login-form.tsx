"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Input, Field } from "@/components/ui";

export function LoginForm({
  googleEnabled,
  devEnabled,
}: {
  googleEnabled: boolean;
  devEnabled: boolean;
}) {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("admin@local.dev");
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-4">
      {googleEnabled && (
        <Button
          className="w-full"
          onClick={() => signIn("google", { callbackUrl })}
        >
          <GoogleIcon /> Iniciar sesión con Google
        </Button>
      )}

      {devEnabled && (
        <>
          {googleEnabled && (
            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400">o acceso local</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setLoading(true);
              signIn("credentials", { email, callbackUrl });
            }}
            className="space-y-3"
          >
            <Field label="Correo (acceso local)">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Button
              type="submit"
              variant="secondary"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Entrando…" : "Entrar (modo local)"}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.5-2.1 14.3-5.5l-6.6-5.6C29.7 34.6 27 35.5 24 35.5c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.6 5.6C41.9 36.5 44 30.8 44 24c0-1.3-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
