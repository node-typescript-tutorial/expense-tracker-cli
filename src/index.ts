import { Command } from "commander";
import { readCSV } from "./csv";
import { Item, itemModel } from "./item";
import { createInterface } from "readline";

const setUp = async () => {
  let csvData: Item[] = [];
  const csvPath = "./data/data.csv";
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  function promptForCommand(program: Command, question: string = "") {
    rl.question(question, (answer) => {
      if (answer === "exit") {
        rl.close();
        return;
      }

      // parse the input command
      const args = answer.split(" ");
      try {
        program.parse([process.argv[0], process.argv[1], ...args]);
      } catch (error) {
        console.log("error: ", error);
        promptForCommand(program);
      }
    });
  }

  try {
    csvData = await readCSV<Item>(csvPath, itemModel);
    console.log(csvData);
  } catch (e) {
    console.log(`error when read data from CSV file ${csvPath}: `, e);
    throw e;
  }
  const program = new Command();
  program
    .name("expense tracker cli")
    .description("a cli tool for track expense")
    .version("1.0.0");

  program
    .command("expense-tracker add")
    .requiredOption("--description <desc>", "description for item")
    .requiredOption("--amount <amt>", "amount for item")
    .action((options: { desc: string; amount: number }) => {
      promptForCommand(program);
    });

  program.on("command:*", (operands) => {
    console.log(`Unknown command: ${operands.join(" ")}`);
    promptForCommand(program);
  });

  // run
  promptForCommand(program);
};

setUp();
