import { SubmissionForm } from "@/components/SubmissionForm";

export default function ContributePage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-semibold">Pridať slovo</h1>
      <p className="mb-6 text-sm text-foreground/60">
        Navrhnite archaické, nárečové alebo zriedkavé slovenské slovo. Po schválení
        administrátorom sa zobrazí v zozname slov.
      </p>
      <SubmissionForm />
    </div>
  );
}
