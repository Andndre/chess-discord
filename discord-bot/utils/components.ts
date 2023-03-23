import { DI } from "../deps.ts";

export function createButton(
  label: string,
  style: DI.ButtonStyleTypes,
  url?: string,
) {
  return {
    type: DI.MessageComponentTypes.BUTTON,
    label,
    style,
    url,
  } as DI.Button;
}

export function createActionRow(components: DI.MessageComponent[]) {
  return {
    type: DI.MessageComponentTypes.ACTION_ROW,
    components,
  } as DI.MessageComponent;
}
