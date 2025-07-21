import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import GC25GoodbyeEmail from "../../emails/goodbye";
import GC25ConfirmEmailChangeEmail from "../../emails/changedEmail";

const prisma = new PrismaClient();
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ user, newEmail, url }) => {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "no-reply@mail.raffaelschaefer.de",
          to: user.email,
          subject: "[ACTION REQUIERED]: Confirm changed E-Mail",
          react: GC25ConfirmEmailChangeEmail({
            userName: user.name,
            url: url,
            oldEmail: user.email,
            newEmail: newEmail,
          }),
        });
      },
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url }) => {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "no-reply@mail.raffaelschaefer.de",
          to: user.email,
          subject: "Sad to see you go",
          react: GC25GoodbyeEmail({ userName: user.name, url: url }),
        });
      },
    },
  },
});
