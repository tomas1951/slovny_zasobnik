import { prisma } from "@/lib/prisma";

export async function getTagCatalog() {
  return prisma.tag.findMany({ orderBy: { order: "asc" }, select: { slug: true, label: true } });
}
