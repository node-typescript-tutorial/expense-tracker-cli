import { Command } from "commander";
import { Item, itemModel } from "./item/item";
import { createInterface } from "readline";
import { addCommand } from "./item/command";
import { parseCommandLine } from "./helper/parse";
import { CSVClient, CSVService } from "./csv";
import { ItemHandler } from "./item/handler";
import { ItemClient } from "./item/service";

interface Application {
  item: ItemHandler;
  csvService: CSVService<Item>;
}

const setUp = async () => {
  let csvData: Item[] = [];
  const csvPath = "./data/data.csv";
  const csvService: CSVService<Item> = new CSVClient<Item>(
    itemModel,
    csvPath,
    ","
  );

  // Item
  const itemService = new ItemClient(csvService);
  const itemHandler = new ItemHandler(itemService, itemModel);

  const app: Application = {
    csvService: csvService,
    item: itemHandler,
  };
  
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  function promptForCommand(program: Command, question: string = "> ") {
    rl.question(question, (answer) => {
      if (answer.trim() === "exit") {
        rl.close();
        process.exit(0);
      }

      // parse the input command
      try {
        program.parse([
          process.argv[0],
          process.argv[1],
          ...parseCommandLine(answer),
        ]);
      } catch (error) {
        console.log("Error: ", error);
        promptForCommand(program);
      }
    });
  }

  const program = setUpCommand(app, () => {
    promptForCommand(program);
  });

  try {
    csvData = await csvService.readCSV();
    console.log(csvData);
  } catch (e) {
    console.log(`error when read data from CSV file ${csvPath}: `, e);
    throw e;
  }

  // run
  promptForCommand(program);
};

setUp();

function setUpCommand(
  app: Application,
  callbackCmdExecuted?: () => void
): Command {
  const program = new Command();
  program.on("command:*", (operands) => {
    console.log(`Unknown command: ${operands.join(" ")}`);
    callbackCmdExecuted && callbackCmdExecuted();
  });
  program
    .name("expense tracker cli")
    .description("a cli tool for track expense")
    .version("1.0.0");

  program
    .command("expense-tracker")
    .addCommand(addCommand(app.item.add, callbackCmdExecuted));
  program.exitOverride();

  return program;
}
