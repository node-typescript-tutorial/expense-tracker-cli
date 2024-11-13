import { Command } from "commander";
import { readCSV } from "./csv";
import { Item, itemModel } from "./item";
import { createInterface } from "readline";
import { addCommand } from "./item/command";
import { parseCommandLine } from "./helper/parse";

const setUp = async () => {
  let csvData: Item[] = [];
  const csvPath = "./data/data.csv";
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
  const program = setUpCommand(() => {
    promptForCommand(program);
  });

  try {
    csvData = await readCSV<Item>(csvPath, itemModel);
    console.log(csvData);
  } catch (e) {
    console.log(`error when read data from CSV file ${csvPath}: `, e);
    throw e;
  }

  // run
  promptForCommand(program);
};

setUp();

function setUpCommand(callbackCmdExecuted?: () => void): Command {
  const program = new Command();
  program.on("command:*", (operands) => {
    console.log(`Unknown command: ${operands.join(" ")}`);
    callbackCmdExecuted && callbackCmdExecuted();
  });
  program
    .name("expense tracker cli")
    .description("a cli tool for track expense")
    .version("1.0.0");

  

  program.command("expense-tracker").addCommand(addCommand(callbackCmdExecuted));
  program.exitOverride();

  return program;
}


