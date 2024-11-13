import { addLine } from "src/csv";
import { Item } from "src/item";
import { Model } from "src/model";
import { IItemRepository } from "./reository";

export class Handler {
  private repository: IItemRepository;
  private model: Model<Item>;
  constructor(repository: IItemRepository, model: Model<Item>){
    this.repository = repository;
    this.model = model;

  }
}
export const addHandler = (opts: {description: string, amount: string}, command: any): void => {
  console.log("options:", opts, command);

  // Parse and validate value 
  if (opts.description == undefined && opts.amount == undefined) {
    console.log("Error: description and amount are required");
  } else {
    const description = opts.description;
    const amount = parseFloat(opts.amount);
    if (isNaN(amount)) {
      console.log("Error: Amount must be a number.");
    } else {
      console.log(`Description: ${description}`);
      console.log(`Amount: ${amount}`);
    }

  }


};

