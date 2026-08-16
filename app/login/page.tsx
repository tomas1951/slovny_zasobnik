import Link from "next/link";
import { googleSignIn } from "@/lib/actions/auth";
import { CredentialsSignInForm } from "@/components/CredentialsSignInForm";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold">Prihlásiť sa</h1>
      {params.registered && (
        <p className="mb-4 rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
          Registrácia prebehla úspešne. Teraz sa môžete prihlásiť.
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
          className="w-full rounded-md border border-foreground/15 px-4 py-2"
        >
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
