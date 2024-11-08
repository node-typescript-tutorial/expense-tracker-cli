import { Command } from "commander";
import { readCSV } from "./csv";
import { Item, itemModel } from "./item";

const csvPath = "./data/data.csv";

let csvData: Item[] = [];

readCSV<Item>(csvPath, itemModel)
  .then((val) => {
    csvData = val;
  })
  .catch((e) => {
    console.log(`error when read data from CSV file ${csvPath}: `, e);
    return;
  });

const program = new Command();
program
  .name("expense tracker cli")
  .description("a cli tool for track expense")
  .version("1.0.0");

program
  .command("expense-tracker add")
  .requiredOption("--description <desc>", "description for item")
  .requiredOption("--amount <amt>", "amount for item")
  .action((options: { desc: string; amount: number }) => {});

program.parse(process.argv);

const handleInput = () => {};
