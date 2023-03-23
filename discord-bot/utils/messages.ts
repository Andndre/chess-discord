import { DI, utils } from "../deps.ts";

export function sendChannelMessageText(
  res: utils.MyResponse,
  content: string,
) {
  sendChannelMessage(res, {
    content,
  });
}

export function sendChannelMessage(res: utils.MyResponse, data: {
  content: string;
  components?: DI.MessageComponent[];
}) {
  res.send({
    type: DI.InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data,
  });
}
