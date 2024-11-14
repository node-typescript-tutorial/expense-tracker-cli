import { Command } from "commander";
import { Item, itemModel } from "./item/item";
import { createInterface } from "readline";
import { addCommand } from "./item/command";
import { parseCommandLine } from "./helper/parse";
import { CSVRepository, ICSVRepository } from "./csv";
import { ItemHandler } from "./item/handler";
import { ItemClient } from "./item/service";
import { SequenceRepository } from "./sequence/sequence_repository";
import { SequenceModel } from "./sequence/sequence";
import { SequenceClient, SequenceService } from "./sequence/sequence_service";

interface Application {
  item: ItemHandler;
  sequence: SequenceService;
}

const setUp = async () => {
  let csvData: Item[] = [];
  const itemPath = "./data/items.csv";
  const sequencePath = "./data/sequence.csv"
  // Item
  const itemRepository: ICSVRepository<Item> = new CSVRepository<Item>(
    itemModel,
    itemPath,
    ","
  );
  const itemService = new ItemClient(itemRepository, () => {
    return "string";
  });
  const itemHandler = new ItemHandler(itemService, itemModel);

  // sequence
  const sequenceRepository = new SequenceRepository(SequenceModel, sequencePath)
  const sequenceService = new SequenceClient(sequenceRepository)
  const app: Application = {
    item: itemHandler,
    sequence: sequenceService,
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
    const { list, total } = await itemService.getAll();
    console.log(list);
  } catch (e) {
    console.log(`error when read data from CSV file ${itemPath}: `, e);
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
