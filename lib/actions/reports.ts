"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const reportSchema = z.object({
  wordId: z.string().min(1),
  tags: z.array(z.string()).min(1, "Vyberte aspoň jeden príznak"),
  message: z.string().trim().optional(),
});

export async function reportWordIssue(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  const session = await auth();

  const parsed = reportSchema.safeParse({
    wordId: formData.get("wordId"),
    tags: formData.getAll("tags"),
    message: formData.get("message") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { wordId, tags, message } = parsed.data;

  const validTags = await prisma.tag.findMany({ where: { slug: { in: tags } }, select: { slug: true } });
  if (validTags.length !== tags.length) {
    return { error: "Neplatný príznak" };
  }

  await prisma.wordReport.create({
    data: {
      wordId,
      message: message?.trim() || null,
      proposedTags: tags,
      reporterId: session?.user?.id ?? null,
    },
  });

  return { success: true };
}
