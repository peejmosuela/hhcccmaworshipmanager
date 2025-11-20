import { FastifyInstance } from "fastify";
import { lucia } from "./auth";
import { db } from "./db";
import { users } from "./schema";
import bcrypt from "bcryptjs";

export async function authRoutes(app: FastifyInstance) {
  // Register
  app.post("/api/register", async (request, reply) => {
    const { email, password, name } = request.body as any;
    if (!email || !password) return reply.status(400).send("Missing fields");

    const hashed = await bcrypt.hash(password, 10);
    try {
      await db.insert(users).values({ email, passwordHash: hashed, name });
    } catch {
      return reply.status(400).send("Email already exists");
    }

    const session = await lucia.createSession(email, {});
    reply.setCookie("auth_session", session.id, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    });
    return { success: true };
  });

  // Login
  app.post("/api/login", async (request, reply) => {
    const { email, password } = request.body as any;
    const user = await db.select().from(users).where({ email }).limit(1);
    if (!user[0] || !await bcrypt.compare(password, user[0].passwordHash)) {
      return reply.status(400).send("Wrong email or password");
    }

    const session = await lucia.createSession(user[0].id, {});
    reply.setCookie("auth_session", session.id, { path: "/", httpOnly: true });
    return { success: true };
  });

  // Logout
  app.post("/api/logout", async (request, reply) => {
    const sessionId = request.cookies.auth_session;
    if (sessionId) await lucia.invalidateSession(sessionId);
    reply.clearCookie("auth_session");
    return { success: true };
  });
}
