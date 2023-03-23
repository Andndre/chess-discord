import { MyResponse } from "./mod.ts";
import {
  InteractionResponseType,
  MessageComponent,
} from "discord-interactions";

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
