import { Context, Handler, Hono, Next } from "hono";
import {
  InteractionType,
  InteractionResponseType,
  verifyKey,
} from "discord-interactions";
import dayjs from "dayjs";

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
          const durationRaw = body.data.options[1].value;
          const duration = parseInt(durationRaw.match(/\d+/)[0]);
          const durationUnit = durationRaw.replace(/\d+/g, "");
          const repopInfo: RepopInfo = {
            registerUserId: body.member.user.id,
            itemName: body.data.options[0].value,
            startTimeStamp: dayjs().toISOString(),
            endTimeStamp: dayjs().add(duration, durationUnit).toISOString(),
          };

          try {
            await c.env.DB.prepare(
              "INSERT INTO repop_items (discord_user_id, item_name, start_timestamp, end_timestamp) VALUES (?1, ?2, ?3, ?4)",
            )
              .bind(
                repopInfo.registerUserId,
                repopInfo.itemName,
                repopInfo.startTimeStamp,
                repopInfo.endTimeStamp,
              )
              .run();
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
          return c.json({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `registerd: ${repopInfo.itemName}, it will be repoped at ${repopInfo.endTimeStamp}`,
            },
          });
        }
        case "verify": {
          const itemName = body.data.options[0].value;
          try {
            const res = await c.env.DB.prepare(
              "SELECT item_name as itemName, start_timestamp as startTimeStamp, end_timestamp as endTimeStamp FROM repop_items WHERE item_name = ?1",
            )
              .bind(itemName)
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
