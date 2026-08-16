import Link from "next/link";
import type { Session } from "next-auth";
import { BookOpenText, Library, PlusCircle, ShieldCheck, LogIn, LogOut } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";

export function Header({ session }: { session: Session | null }) {
  return (
    <header className="border-b border-foreground/10">
      <div className="mx-auto flex max-w-[930px] items-center justify-between gap-4 px-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-2xl font-bold tracking-tight text-accent-strong hover:opacity-80 sm:text-3xl"
        >
          <BookOpenText className="h-6 w-6 sm:h-7 sm:w-7" />
          Slovný zásobník
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/words"
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-4 py-1.5 text-foreground/80 transition-colors hover:bg-foreground/10"
          >
            <Library className="h-4 w-4" />
            Databáza slov
          </Link>
          {session?.user && (
            <Link
              href="/contribute"
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-4 py-1.5 text-foreground/80 transition-colors hover:bg-foreground/10"
            >
              <PlusCircle className="h-4 w-4" />
              Pridať slovo
            </Link>
          )}
          {session?.user?.role === "ADMIN" && (
            <Link
              href="/admin/submissions"
              className="inline-flex items-center gap-1.5 rounded-full bg-neutral-700 px-4 py-1.5 text-white transition-colors hover:bg-neutral-800"
            >
              <ShieldCheck className="h-4 w-4" />
              Návrhy
            </Link>
          )}
          {session?.user ? (
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full bg-accent-strong px-4 py-1.5 text-on-accent transition-opacity hover:opacity-90"
              >
                <LogOut className="h-4 w-4" />
                Odhlásiť ({session.user.name ?? session.user.email})
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-full bg-accent-strong px-4 py-1.5 text-on-accent transition-opacity hover:opacity-90"
            >
              <LogIn className="h-4 w-4" />
              Prihlásiť sa
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
