import { Context, Handler, Hono, Next } from "hono";
import {
  InteractionType,
  InteractionResponseType,
  verifyKey,
} from "discord-interactions";
import dayjs from "dayjs";
import { register, RegisterInput } from "./command/register";

type Bindings = {
  APPLICATION_ID: string;
  PUBLIC_KEY: string;
  TOKEN: string;
  DB: D1Database;
};
const app = new Hono<{ Bindings: Bindings }>();

type RepopInfo = {
  registerUserId: number;
  itemName: string;
  startTimeStamp: string;
  endTimeStamp: string;
};

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
          const res = await register(c, {
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
          const userId = body.member.user.id;
          const itemName = body.data.options[0].value;
          try {
            const res = await c.env.DB.prepare(
              "SELECT item_name as itemName, start_timestamp as startTimeStamp, end_timestamp as endTimeStamp FROM repop_items WHERE item_name = ?1 and discord_user_id = ?2",
            )
              .bind(itemName, userId)
              .first<RepopInfo>();
            if (!res) {
              return c.json({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: { content: "item not registered" },
              });
            }

            if (dayjs().isAfter(res.endTimeStamp)) {
              return c.json({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: { content: "item repoped" },
              });
            }
            return c.json({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `${res.itemName} is not repoped yet. it will be repoped at ${res.endTimeStamp}`,
              },
            });
          } catch (e) {
            if (e instanceof Error) {
              return c.json({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: { content: e.message },
              });
            }
            const err = JSON.stringify(e);
            return c.json({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: { content: err },
            });
          }
        }
      }
    }
  }
});

export default app;
