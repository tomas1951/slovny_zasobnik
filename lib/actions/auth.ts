"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";

const registerSchema = z.object({
  name: z.string().min(1, "Zadajte meno"),
  email: z.email("Neplatný e-mail"),
  password: z.string().min(8, "Heslo musí mať aspoň 8 znakov"),
});

export async function registerUser(_prevState: { error?: string } | undefined, formData: FormData) {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { name, email, password } = parsed.data;

  if (await prisma.user.findUnique({ where: { email } })) {
    return { error: "Tento e-mail už je zaregistrovaný" };
  }

  await prisma.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 12), role: "USER" },
  });

  redirect("/login?registered=1");
}

export async function credentialsSignIn(_prevState: { error?: string } | undefined, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Nesprávny e-mail alebo heslo" };
    }
    throw error;
  }
}

export async function googleSignIn() {
  await signIn("google", { redirectTo: "/" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
