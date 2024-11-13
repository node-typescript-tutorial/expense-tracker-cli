import { Command } from "commander";
import { addHandler } from "./add-handler";

// COMMAND: expense-tracker add --description <desc> --amount <amt>
export const addCommand = (callbackCmdExecuted: (() => void) | undefined) =>
  new Command("add")
    .enablePositionalOptions()
    .option("--description <desc>")
    .option("--amount <amt>")
    .description("add new item")
    .action(addHandler)
    .hook("postAction", () => {
      callbackCmdExecuted && callbackCmdExecuted();
    });
