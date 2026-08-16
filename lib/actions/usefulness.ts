"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Choice = "useful" | "not-useful";

export async function voteWordUsefulness(
  wordId: string,
  choice: Choice | null,
  previousChoice: Choice | null,
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (choice === previousChoice) return;

  const usefulDelta = (choice === "useful" ? 1 : 0) - (previousChoice === "useful" ? 1 : 0);
  const notUsefulDelta = (choice === "not-useful" ? 1 : 0) - (previousChoice === "not-useful" ? 1 : 0);

  const word = await prisma.word.update({
    where: { id: wordId },
    data: {
      ...(usefulDelta !== 0 ? { usefulCount: { increment: usefulDelta } } : {}),
      ...(notUsefulDelta !== 0 ? { notUsefulCount: { increment: notUsefulDelta } } : {}),
    },
    select: { slug: true },
  });

  revalidatePath("/");
  revalidatePath(`/words/${word.slug}`);
}
