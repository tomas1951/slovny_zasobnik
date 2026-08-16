import Link from "next/link";
import { RegisterForm } from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold">Registrácia</h1>
      <RegisterForm />
      <p className="mt-6 text-sm text-foreground/60">
        Už máte účet?{" "}
        <Link href="/login" className="text-accent-text underline hover:no-underline">
          Prihláste sa
        </Link>
      </p>
    </div>
  );
}
