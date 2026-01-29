import { Strapi } from "@strapi/strapi";
import { Context } from "koa";

interface SyncRequestBody {
  clerkId: string;
  email: string;
}

export default ({ strapi }: { strapi: Strapi }) => ({
  async sync(ctx: Context) {
    const { clerkId, email } = ctx.request.body as SyncRequestBody;

    if (!clerkId || !email) {
      return ctx.badRequest("Faltan clerkId o email en el cuerpo de la solicitud");
    }

    try {
      let user = await strapi.db.query("plugin::users-permissions.user").findOne({
        where: { clerkId: clerkId }
      });

      if (!user) {
        const defaultRole = await strapi.db.query("plugin::users-permissions.role").findOne({
          where: { type: "authenticated" },
        });

        const username = email.split("@")[0];

        user = await strapi.db.query("plugin::users-permissions.user").create({
          data: {
            username: username,
            email: email,
            clerkId: clerkId,
            role: defaultRole.id,
            provider: "local",
            confirmed: true,
            hasOnboarded: false,
          }
        })

        strapi.log.info(`✅Usuario creado y sincronizado:${email}`);
      } else {
        strapi.log.info(`✅Usuario encontrado y sincronizado:${email}`);
      }

      const jwt = strapi.plugins["users-permissions"].services.jwt.issue({
        id: user.id,
      });

      return {
        jwt,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          clerkId: user.clerkId,
          hasOnboarded: user.hasOnboarded,
        },
      };
    } catch (error) {
      strapi.log.error("Error durante la sincronizacion de ususaio:", error);
      return ctx.internalServerError("Error al sincronizar el usuario");
    }
  },
});
