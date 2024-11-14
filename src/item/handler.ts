import { IItemService, Item } from "src/item/item";
import { Model } from "src/model";

export class ItemHandler {
  private service: IItemService;
  private model: Model<Item>;
  constructor(service: IItemService, model: Model<Item>) {
    this.service = service;
    this.model = model;
    this.add = this.add.bind(this);
  }


  add = (
    opts: { description: string; amount: string },
    command: any
  ): void => {
    console.log("options:", opts, command);
  
    // Parse and validate value
    if (opts.description == undefined && opts.amount == undefined) {
      console.log("Error: description and amount are required");
      return;
    } else {
      const description = opts.description;
      const amount = parseFloat(opts.amount);
      if (isNaN(amount)) {
        console.log("Error: Amount must be a number.");
        return;
      } else {
        console.log(`Description: ${description}`);
        console.log(`Amount: ${amount}`);
        this.service.create(description, amount)
        // handle logic

        ///////////////////////
      }
    }
  };
  
}
 