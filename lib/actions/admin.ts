"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { POS_OPTIONS } from "@/lib/tags";
import { WordStatus } from "@/generated/prisma/enums";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Forbidden");
  return session;
}

export async function approveWord(meaningId: string) {
  const session = await requireAdmin();
  await prisma.wordMeaning.update({
    where: { id: meaningId },
    data: { status: WordStatus.PUBLISHED, reviewedById: session.user.id, reviewedAt: new Date() },
  });
  revalidatePath("/admin/submissions");
}

export async function rejectWord(meaningId: string) {
  const session = await requireAdmin();
  await prisma.wordMeaning.update({
    where: { id: meaningId },
    data: { status: WordStatus.REJECTED, reviewedById: session.user.id, reviewedAt: new Date() },
  });
  revalidatePath("/admin/submissions");
}

export async function applyWordReport(reportId: string) {
  await requireAdmin();
  const report = await prisma.wordReport.findUniqueOrThrow({ where: { id: reportId } });

  if (report.proposedTags.length > 0) {
    await prisma.word.update({
      where: { id: report.wordId },
      data: { tags: { set: report.proposedTags.map((slug) => ({ slug })) } },
    });
  }

  await prisma.wordReport.delete({ where: { id: reportId } });
  revalidatePath("/admin/submissions");
}

export async function dismissWordReport(reportId: string) {
  await requireAdmin();
  await prisma.wordReport.delete({ where: { id: reportId } });
  revalidatePath("/admin/submissions");
}

// Scoped to a single meaning's own fields (pos/meaning/status). Tags and the
// Word's headword/slug are shared across every meaning under it, so they
// aren't exposed here — tags have their own edit affordance
// (EditWordTagsButton/updateWordTags), and renaming/re-slugging is still a
// direct-DB edit.
const updateMeaningSchema = z.object({
  meaningId: z.string().min(1),
  pos: z.union([z.enum(POS_OPTIONS), z.literal("")]).optional(),
  meaning: z.string().trim().min(1, "Zadajte význam"),
  status: z.enum([WordStatus.PENDING, WordStatus.PUBLISHED, WordStatus.REJECTED]),
});

export async function updateWordByAdmin(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  await requireAdmin();

  const parsed = updateMeaningSchema.safeParse({
    meaningId: formData.get("meaningId"),
    pos: formData.get("pos") ?? "",
    meaning: formData.get("meaning"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { meaningId, pos, meaning, status } = parsed.data;

  const current = await prisma.wordMeaning.update({
    where: { id: meaningId },
    data: { pos: pos || null, meaning, status },
    select: { word: { select: { slug: true } } },
  });

  revalidatePath("/");
  revalidatePath("/words");
  revalidatePath(`/words/${current.word.slug}`);
  revalidatePath("/admin/submissions");

  return { success: true };
}

export async function updateWordTags(wordId: string, tagSlugs: string[]) {
  await requireAdmin();

  const word = await prisma.word.update({
    where: { id: wordId },
    data: { tags: { set: tagSlugs.map((slug) => ({ slug })) } },
    select: { slug: true },
  });

  revalidatePath("/");
  revalidatePath("/words");
  revalidatePath(`/words/${word.slug}`);
  revalidatePath("/admin/submissions");
}

export async function deleteWordMeaning(meaningId: string) {
  await requireAdmin();

  const meaning = await prisma.wordMeaning.delete({
    where: { id: meaningId },
    select: { word: { select: { slug: true } } },
  });

  revalidatePath("/");
  revalidatePath("/words");
  revalidatePath(`/words/${meaning.word.slug}`);
  revalidatePath("/admin/submissions");
}

// WordMeaning and WordReport cascade on Word deletion (onDelete: Cascade in
// the schema); the Tag join table rows are dropped too, but the Tag rows
// themselves are untouched since they're a shared catalog, not owned by
// this word.
export async function deleteWord(wordId: string) {
  await requireAdmin();

  const word = await prisma.word.delete({ where: { id: wordId }, select: { slug: true } });

  revalidatePath("/");
  revalidatePath("/words");
  revalidatePath(`/words/${word.slug}`);
  revalidatePath("/admin/submissions");
}
