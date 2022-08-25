import { Router } from "itty-router";

interface Env {
  CHAT_ID: string;
  SECRET_STRING: string;
  BOTS: KVNamespace;
}

const router = Router();

const authMiddleware = async (request: Request, env: Env) => {
  const body: Record<string, any> = (await request.json()) || {};
  if (body.secret !== env.SECRET_STRING)
    return new Response("Unauthorized", { status: 401 });
};

router.post(
  "/:botName/:botKey",
  authMiddleware,
  async (
    request: Request & {
      params: {
        botName: string;
        botKey: string;
      };
    },
    env: Env
  ) => {
    const { botName, botKey } = request.params;
    await env.BOTS.put(botName, botKey);
    return new Response("New bot entry set");
  }
);

router.post(
  "/:botName",
  authMiddleware,
  async (
    request: Request & {
      params: { botName: string };
    },
    env: Env
  ) => {
    const body: Record<string, any> = (await request.json()) || {};
    const { botName } = request.params;
    const botKey = await env.BOTS.get(botName);
    if (!botKey) return new Response("Bot not found", { status: 404 });

    try {
      const res = await fetch(
        `https://api.telegram.org/bot${botKey}/sendMessage`,
        {
          method: "POST",
          body: JSON.stringify({
            chat_id: env.CHAT_ID,
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
      if (json.ok) return new Response("Successfully sent message");
      return new Response(`Error sending message: ${json.description}`, {
        status: 500,
      });
    } catch (err) {
      return new Response(`Error sending message: ${err}`, { status: 500 });
    }
  }
);

router.all("*", () => {
  return new Response(
    "Thanks for dropping by! Visit https://github.com/plibither8/tg-bots for more info ;)"
  );
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return router.handle(request, env);
  },
};
