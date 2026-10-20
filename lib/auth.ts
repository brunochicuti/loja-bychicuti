import { betterAuth } from "better-auth";
import { db } from "@/lib/db";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const remetente =
  process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

export const auth = betterAuth({
  database: db,

  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,

    sendVerificationEmail: async ({ user, url }) => {
      if (!resend) {
        console.error(
          "RESEND_API_KEY não está configurada."
        );
        throw new Error("O envio de e-mail não está configurado.");
      }

      const { error } = await resend.emails.send({
        from: remetente,
        to: user.email,
        subject: "Confirme seu e-mail - ByChicuti",
        text: [
          `Olá, ${user.name}!`,
          "",
          "Para confirmar seu e-mail e ativar sua conta ByChicuti, acesse:",
          url,
          "",
          "Se você não solicitou esse cadastro, ignore esta mensagem.",
        ].join("\n"),
      });

      if (error) {
        console.error(
          "Erro ao enviar e-mail de verificação:",
          error.message
        );
        throw new Error("Não foi possível enviar o e-mail de verificação.");
      }
    },
  },
});
