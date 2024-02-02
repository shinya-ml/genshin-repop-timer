import { Context, Hono, Next } from "hono";
import {
  InteractionType,
  InteractionResponseType,
  verifyKey,
} from "discord-interactions";
import { register } from "./command/register";
import { verify } from "./command/verify";
import { list } from "./command/list";
import { deleteItem } from "./command/delete";

type Bindings = {
  APPLICATION_ID: string;
  PUBLIC_KEY: string;
  TOKEN: string;
  DB: D1Database;
};
const app = new Hono<{ Bindings: Bindings }>();

async function verifyKeyMiddleware(c: Context, next: Next) {
  const signature = c.req.header("X-Signature-Ed25519") ?? "";
  const timestamp = c.req.header("X-Signature-Timestamp") ?? "";
  const raw = await c.req.raw.clone().text();
  const isValid = verifyKey(raw, signature, timestamp, c.env.PUBLIC_KEY);
  if (!isValid) {
    return c.json(
      {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { message: "invalid request" },
      },
      401,
    );
  }
  return next();
}

app.post("/", verifyKeyMiddleware, async (c) => {
  const body = await c.req.json();
  switch (body.type) {
    case InteractionType.PING: {
      return c.json({ type: 1 }, 200);
    }
    case InteractionType.APPLICATION_COMMAND: {
      switch (body.data.name) {
        case "test": {
          return c.json({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: "hello world" },
          });
        }
        case "register": {
          const res = await register(c.env.DB, {
            registerUserId: body.member.user.id,
            itemName: body.data.options[0].value,
            duration: body.data.options[1].value,
          });
          return c.json({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: res },
          });
        }
        case "verify": {
          const res = await verify(c.env.DB, {
            userId: body.member.user.id,
            itemName: body.data.options[0].value,
          });
          return c.json({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: res },
          });
        }
        case "list": {
          const res = await list(c.env.DB, body.member.user.id);
          const repopedItems = res.map((item) => item.itemName).join("\n");
          return c.json({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: `repoped item: \n${repopedItems}` },
          });
        }
        case "delete": {
          const res = await deleteItem(c.env.DB, {
            userId: body.member.user.id,
            itemName: body.data.options[0].value,
          })
          return c.json({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {content: res}
          });
        }
      }
    }
  }
});

export default app;
