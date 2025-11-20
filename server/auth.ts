import { FastifyInstance } from "fastify";
import { lucia } from "../auth";
import { db } from "../db";
import { users } from "../schema"; // your existing schema
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post("/api/register", async (request, reply) => {
    const { email, password, name } = request.body as any;
    const hashed = await bcrypt.hash(password, 10);

    try {
      const user = await db.insert(users).values({
        email,
        name,
        password_hash: hashed
      }).returning({ id: users.id });

      const session = await lucia.createSession(user[0].id, {});
      reply.setCookie("auth_session", session.id, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
      });

      return { success: true };
    } catch (e) {
      return { success: false, error: "Email already exists" };
    }
  });

  // Login
  fastify.post("/api/login", async (request, reply) => {
    const { email, password } = request.body as any;
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user[0] || !await bcrypt.compare(password, user[0].password_hash || "")) {
      return { success: false, error: "Wrong email or password" };
    }

    const session = await lucia.createSession(user[0].id, {});
    reply.setCookie("auth_session", session.id, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    });

    return { success: true };
  });

  // Logout
  fastify.post("/api/logout", async (request, reply) => {
    const sessionId = request.cookies.auth_session;
    if (sessionId) await lucia.invalidateSession(sessionId);
    reply.clearCookie("auth_session");
    return { success: true };
  });
}
