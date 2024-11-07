import { Command } from "commander";
import { readFile, readFileSync } from "fs";

interface Item {
  id: string;
  description: string;
  amount: number;
  createdAt: Date;
}

const data = readFileSync("./data/data.csv");

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
