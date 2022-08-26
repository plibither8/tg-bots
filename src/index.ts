import { Hono, type Handler } from "hono";

interface Env {
  CHAT_ID: string;
  SECRET_STRING: string;
  BOTS: KVNamespace;
}

const app = new Hono<Env>();

const authMiddleware: Handler<string, Env> = async (ctx, next) => {
  const body = await ctx.req.json<{ secret: string }>();
  if (body.secret !== ctx.env.SECRET_STRING)
    return ctx.text("Unauthorized", 401);
  await next();
};

app.post("/:botName/:botKey", authMiddleware, async (ctx) => {
  const { botName, botKey } = ctx.req.param();
  await ctx.env.BOTS.put(botName, botKey);
  return ctx.text("New bot entry set");
});

app.post("/:botName", authMiddleware, async (ctx) => {
  const botName = ctx.req.param("botName");
  const botKey = await ctx.env.BOTS.get(botName);
  if (!botKey) return ctx.text("Bot not found", 404);
  try {
    const body = await ctx.req.json<Record<string, any>>();
    const res = await fetch(
      `https://api.telegram.org/bot${botKey}/sendMessage`,
      {
        method: "POST",
        body: JSON.stringify({
          chat_id: ctx.env.CHAT_ID,
          parse_mode: "Markdown",
          disable_web_page_preview: true,
          ...body,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const json = await res.json<{
      ok: boolean;
      description: string;
    }>();
    if (json.ok) return ctx.text("Successfully sent message");
    return ctx.text(`Error sending message: ${json.description}`, 500);
  } catch (err) {
    return ctx.text(`Error sending message: ${err}`, 500);
  }
});

app.all("*", (ctx) =>
  ctx.text(
    "Thanks for dropping by! Visit https://github.com/plibither8/tg-bots for more info ;)"
  )
);

export default app;
