"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { POS_OPTIONS } from "@/lib/tags";
import { WordStatus } from "@/generated/prisma/enums";

const submissionSchema = z.object({
  word: z.string().trim().min(1, "Zadajte slovo"),
  pos: z.union([z.enum(POS_OPTIONS), z.literal("")]).optional(),
  meaning: z.string().trim().min(1, "Zadajte význam"),
  tags: z.array(z.string()).min(1, "Vyberte aspoň jeden príznak"),
});

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(word: string): Promise<string> {
  const base = slugify(word);
  let slug = base;
  let n = 1;
  while (await prisma.word.findUnique({ where: { slug }, select: { id: true } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

export async function submitWord(_prevState: { error?: string; success?: boolean } | undefined, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Musíte byť prihlásený/á" };

  const parsed = submissionSchema.safeParse({
    word: formData.get("word"),
    pos: formData.get("pos") ?? "",
    meaning: formData.get("meaning"),
    tags: formData.getAll("tags"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { word, pos, meaning, tags } = parsed.data;

  const validTags = await prisma.tag.findMany({ where: { slug: { in: tags } }, select: { slug: true } });
  if (validTags.length !== tags.length) {
    return { error: "Neplatný príznak" };
  }

  // Same spelling as an existing word: attach as a new (pending) meaning of
  // that word instead of creating a duplicate entry for the same headword.
  // Tags describe the word as a whole, so the chosen tags are unioned onto
  // it either way (connect is a no-op for ones already there).
  const existingWord = await prisma.word.findFirst({ where: { word } });
  const wordRow = existingWord
    ? await prisma.word.update({
        where: { id: existingWord.id },
        data: { tags: { connect: tags.map((slug) => ({ slug })) } },
      })
    : await prisma.word.create({
        data: { slug: await uniqueSlug(word), word, tags: { connect: tags.map((slug) => ({ slug })) } },
      });

  await prisma.wordMeaning.create({
    data: {
      wordId: wordRow.id,
      pos: pos || null,
      meaning,
      status: WordStatus.PENDING,
      submittedById: session.user.id,
    },
  });

  return { success: true };
}
