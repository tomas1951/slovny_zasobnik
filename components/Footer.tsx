import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-foreground/10 bg-foreground/5">
      <div className="mx-auto grid max-w-[930px] gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <h3 className="text-base font-semibold text-accent-strong">Slovný zásobník</h3>
          <p className="mt-3 max-w-xs text-sm text-foreground/60">
            Rozširujeme aktívnu slovnú zásobu slovenčiny o zabudnuté a menej používané slová.
          </p>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/50">
            Navigácia
          </h4>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link href="/" className="text-foreground/70 transition-colors hover:text-accent-text">
              Domov
            </Link>
            <Link href="/words" className="text-foreground/70 transition-colors hover:text-accent-text">
              Databáza slov
            </Link>
            <Link href="/login" className="text-foreground/70 transition-colors hover:text-accent-text">
              Prihlásiť sa
            </Link>
            <Link href="/register" className="text-foreground/70 transition-colors hover:text-accent-text">
              Registrácia
            </Link>
          </div>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/50">
            Zdroj dát
          </h4>
          <div className="mt-3 flex flex-col gap-2 text-sm text-foreground/70">
            <p>
              Časť slov pochádza zo{" "}
              <a
                href="https://sk.wiktionary.org"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-accent-text"
              >
                Slovenského Wiktionary
              </a>
              , ostatné dopĺňa komunita.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
