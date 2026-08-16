"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ALL_TAGS } from "@/lib/tags";

const reportSchema = z.object({
  wordId: z.string().min(1),
  meaning: z.string().trim().min(1, "Zadajte význam"),
  tags: z.array(z.enum(ALL_TAGS as [string, ...string[]])).min(1, "Vyberte aspoň jeden príznak"),
  message: z.string().trim().optional(),
});

export async function reportWordIssue(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  const session = await auth();

  const parsed = reportSchema.safeParse({
    wordId: formData.get("wordId"),
    meaning: formData.get("meaning"),
    tags: formData.getAll("tags"),
    message: formData.get("message") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { wordId, meaning, tags, message } = parsed.data;

  await prisma.wordReport.create({
    data: {
      wordId,
      message: message?.trim() || null,
      proposedMeaning: meaning,
      proposedTags: tags,
      reporterId: session?.user?.id ?? null,
    },
  });

  return { success: true };
}
