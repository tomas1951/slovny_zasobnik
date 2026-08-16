"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

type Choice = "yes" | "no";

export async function submitWordPoll(wordId: string, choice: Choice, previousChoice: Choice | null) {
  if (choice === previousChoice) return;

  const knewDelta = choice === "yes" ? 1 : previousChoice === "yes" ? -1 : 0;
  const didntKnowDelta = choice === "no" ? 1 : previousChoice === "no" ? -1 : 0;

  const word = await prisma.word.update({
    where: { id: wordId },
    data: {
      ...(knewDelta !== 0 ? { knewCount: { increment: knewDelta } } : {}),
      ...(didntKnowDelta !== 0 ? { didntKnowCount: { increment: didntKnowDelta } } : {}),
    },
    select: { slug: true },
  });

  revalidatePath("/");
  revalidatePath(`/words/${word.slug}`);
}
