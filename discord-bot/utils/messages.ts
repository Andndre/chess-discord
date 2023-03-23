import {
  InteractionResponseType,
  type MessageComponent,
} from "npm:discord-interactions";

import type { MyResponse } from "./types.ts";

export function sendChannelMessageText(
  res: MyResponse,
  content: string,
) {
  sendChannelMessage(res, {
    content,
  });
}

export function sendChannelMessage(res: MyResponse, data: {
  content: string;
  components?: MessageComponent[];
}) {
  res.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data,
  });
}
