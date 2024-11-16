import { IItemService, Item } from "../item/item";
import { Model } from "../model";

export class ItemHandler {
  private service: IItemService;
  private model: Model<Item>;
  constructor(service: IItemService, model: Model<Item>) {
    this.service = service;
    this.model = model;
    this.add = this.add.bind(this);
    this.load = this.load.bind(this);
    this.delete =this.delete.bind(this);
  }

  load = (opts: { id: string }, command: any): void => {
    if (opts.id == undefined) {
      console.log("id is required");
      return;
    } else {
      const id = opts.id;
      
      this.service
        .load(id)
        .then((item) => {
          if (item) {
            console.log(item);
          } else {
            console.log("item not found");
          }
        })
        .catch((e) => {
          console.log("Error: ", e);
        });
    }
  };

  delete = (opts: { id: string }, command: any): void => {
    if (opts.id == undefined) {
      console.log("id is required");
      return;
    } else {
      const id = opts.id;
      
      this.service
        .delete(id)
        .then((result) => {
          if (result == 0) {
            console.log("item not found");
          } else {
            console.log(" Expense deleted successfully");
            
          }
        })
        .catch((e) => {
          console.log("Error: ", e);
        });
    }
  };

  add = (opts: { description: string; amount: string }, command: any): void => {
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
        this.service
          .insert(description, amount)
          .then(() => {
            console.log("add new expense successfully");
          })
          .catch((e) => {
            console.log("Error: ", e);
          });
      }
    }
  };
}
