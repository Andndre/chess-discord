import {
  type Button,
  ButtonStyleTypes,
  type MessageComponent,
  MessageComponentTypes,
} from "npm:discord-interactions";

export function createButton(
  label: string,
  style: ButtonStyleTypes,
  url?: string,
) {
  return {
    type: MessageComponentTypes.BUTTON,
    label,
    style,
    url,
  } as Button;
}

export function createActionRow(components: MessageComponent[]) {
  return {
    type: MessageComponentTypes.ACTION_ROW,
    components,
  } as MessageComponent;
}
