import { Router } from "itty-router";
import BOTS from "./bots";

interface Env {
  CHAT_ID: string;
  SECRET_STRING: string;
}

const router = Router();

router.post("*", async (request: Request, env: Env) => {
  const body: Record<string, any> = (await request.json()) || {};
  if (body.secret !== env.SECRET_STRING)
    return new Response("Unauthorized", { status: 401 });

  const { pathname } = new URL(request.url);
  const botName = pathname.slice(1);
  const botKey = BOTS[botName];
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
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return router.handle(request, env);
  },
};
