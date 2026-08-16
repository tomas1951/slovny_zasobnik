"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ALL_TAGS, POS_OPTIONS } from "@/lib/tags";
import { WordStatus } from "@/generated/prisma/enums";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Forbidden");
  return session;
}

export async function approveWord(wordId: string) {
  const session = await requireAdmin();
  await prisma.word.update({
    where: { id: wordId },
    data: { status: WordStatus.PUBLISHED, reviewedById: session.user.id, reviewedAt: new Date() },
  });
  revalidatePath("/admin/submissions");
}

export async function rejectWord(wordId: string) {
  const session = await requireAdmin();
  await prisma.word.update({
    where: { id: wordId },
    data: { status: WordStatus.REJECTED, reviewedById: session.user.id, reviewedAt: new Date() },
  });
  revalidatePath("/admin/submissions");
}

export async function applyWordReport(reportId: string) {
  await requireAdmin();
  const report = await prisma.wordReport.findUniqueOrThrow({ where: { id: reportId } });
  await prisma.word.update({
    where: { id: report.wordId },
    data: {
      ...(report.proposedMeaning ? { meaning: report.proposedMeaning } : {}),
      ...(report.proposedTags.length > 0 ? { tags: report.proposedTags } : {}),
    },
  });
  await prisma.wordReport.delete({ where: { id: reportId } });
  revalidatePath("/admin/submissions");
}

export async function dismissWordReport(reportId: string) {
  await requireAdmin();
  await prisma.wordReport.delete({ where: { id: reportId } });
  revalidatePath("/admin/submissions");
}

const updateWordSchema = z.object({
  wordId: z.string().min(1),
  word: z.string().trim().min(1, "Zadajte slovo"),
  pos: z.union([z.enum(POS_OPTIONS), z.literal("")]).optional(),
  slug: z.string().trim().min(1, "Zadajte identifikátor"),
  meaning: z.string().trim().min(1, "Zadajte význam"),
  tags: z.array(z.enum(ALL_TAGS as [string, ...string[]])).min(1, "Vyberte aspoň jeden príznak"),
  status: z.enum([WordStatus.PENDING, WordStatus.PUBLISHED, WordStatus.REJECTED]),
});

export async function updateWordByAdmin(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  await requireAdmin();

  const parsed = updateWordSchema.safeParse({
    wordId: formData.get("wordId"),
    word: formData.get("word"),
    pos: formData.get("pos") ?? "",
    slug: formData.get("slug"),
    meaning: formData.get("meaning"),
    tags: formData.getAll("tags"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { wordId, word, pos, slug, meaning, tags, status } = parsed.data;

  const current = await prisma.word.findUniqueOrThrow({ where: { id: wordId } });

  if (slug !== current.slug) {
    const slugOwner = await prisma.word.findUnique({ where: { slug }, select: { id: true } });
    if (slugOwner) return { error: "Tento identifikátor (slug) už používa iné slovo" };
  }

  await prisma.word.update({
    where: { id: wordId },
    data: { word, pos: pos || null, slug, meaning, tags, status },
  });

  revalidatePath("/");
  revalidatePath("/words");
  revalidatePath(`/words/${current.slug}`);
  if (slug !== current.slug) revalidatePath(`/words/${slug}`);
  revalidatePath("/admin/submissions");

  return { success: true };
}
