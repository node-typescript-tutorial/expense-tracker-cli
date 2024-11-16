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

export const loadCommand = (
  loadHandler: (opts: any, command: any) => void,
  callbackCmdExecuted: (() => void) | undefined
) =>
  new Command("load")
    .enablePositionalOptions()
    .option("--id <id>")
    .description("load id")
    .action(loadHandler)
    .hook("postAction", () => {
      callbackCmdExecuted && callbackCmdExecuted();
    });

    export const deleteCommand = (
      handler: (opts: any, command: any) => void,
      callbackCmdExecuted: (() => void) | undefined
    ) =>
      new Command("delete")
        .enablePositionalOptions()
        .option("--id <id>")
        .description("load id")
        .action(handler)
        .hook("postAction", () => {
          callbackCmdExecuted && callbackCmdExecuted();
        });
    