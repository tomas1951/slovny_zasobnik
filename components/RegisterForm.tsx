"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { registerUser } from "@/lib/actions/auth";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerUser, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        type="text"
        name="name"
        placeholder="Meno"
        required
        className="rounded-md border border-foreground/15 bg-transparent px-3 py-2"
      />
      <input
        type="email"
        name="email"
        placeholder="E-mail"
        required
        className="rounded-md border border-foreground/15 bg-transparent px-3 py-2"
      />
      <input
        type="password"
        name="password"
        placeholder="Heslo (aspoň 8 znakov)"
        required
        minLength={8}
        className="rounded-md border border-foreground/15 bg-transparent px-3 py-2"
      />
      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-1.5 rounded-md bg-accent-strong px-4 py-2 text-on-accent hover:opacity-90 disabled:opacity-50"
      >
        <UserPlus className="h-4 w-4" />
        {pending ? "Registrujem..." : "Zaregistrovať sa"}
      </button>
    </form>
  );
}
