import Link from "next/link";
import { googleSignIn } from "@/lib/actions/auth";
import { CredentialsSignInForm } from "@/components/CredentialsSignInForm";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "Tento e-mail je už zaregistrovaný s lokálnym účtom (heslom). Prihláste sa heslom.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const errorParam = Array.isArray(params.error) ? params.error[0] : params.error;
  const errorMessage = errorParam
    ? (OAUTH_ERROR_MESSAGES[errorParam] ?? "Prihlásenie zlyhalo. Skúste to znova.")
    : undefined;

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold">Prihlásiť sa</h1>
      {params.registered && (
        <p className="mb-4 rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
          Registrácia prebehla úspešne. Teraz sa môžete prihlásiť.
        </p>
      )}
      {errorMessage && (
        <p className="mb-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {errorMessage}
        </p>
      )}
      <CredentialsSignInForm />
      <div className="my-6 flex items-center gap-3 text-xs text-foreground/40">
        <div className="h-px flex-1 bg-foreground/10" />
        alebo
        <div className="h-px flex-1 bg-foreground/10" />
      </div>
      <form action={googleSignIn}>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent-strong px-4 py-2 text-on-accent hover:opacity-90"
        >
          <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
            <path
              fill="#FFC107"
              d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"
            />
            <path
              fill="#FF3D00"
              d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.5 0 10.5-2.1 14.3-5.6l-6.6-5.6C29.6 34.8 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.3 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6C41.5 36.5 44 30.9 44 24c0-1.2-.1-2.4-.4-3.5z"
            />
          </svg>
          Prihlásiť sa cez Google
        </button>
      </form>
      <p className="mt-6 text-sm text-foreground/60">
        Nemáte účet?{" "}
        <Link href="/register" className="text-accent-text underline hover:no-underline">
          Zaregistrujte sa
        </Link>
      </p>
    </div>
  );
}
