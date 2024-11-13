import { Command } from "commander";

// COMMAND: expense-tracker add --description <desc> --amount <amt>
export const addCommand = (
  addHandler: (opts: any, command: any) => void,
  callbackCmdExecuted: (() => void) | undefined
) =>
  new Command("add")
    .enablePositionalOptions()
    .option("--description <desc>")
    .option("--amount <amt>")
    .description("add new item")
    .action(addHandler)
    .hook("postAction", () => {
      callbackCmdExecuted && callbackCmdExecuted();
    });
