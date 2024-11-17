import { log } from "console";
import { formatDate } from "../date";
import { IItemService, Item } from "../item/item";
import { Model } from "../model";

const MonthMap: { [key: number]: string } = {
  0: "January",
  1: "February",
  2: "March",
  3: "April",
  4: "May",
  5: "June",
  6: "July",
  7: "August",
  8: "September",
  9: "October",
  10: "November",
  11: "December",
};

export class ItemHandler {
  private service: IItemService;
  private model: Model<Item>;
  constructor(service: IItemService, model: Model<Item>) {
    this.service = service;
    this.model = model;
    this.add = this.add.bind(this);
    this.load = this.load.bind(this);
    this.delete = this.delete.bind(this);
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

  search = (
    opts: { description?: string; amount?: string },
    command: any
  ): void => {
    this.service.all().then((data) => {
      const columnWidth = 16;
      let headerLine = "#";
      for (const k in this.model) {
        let k2 = k as keyof Model<Item>;
        if (this.model[k2] && this.model[k2].csv) {
          headerLine =
            headerLine + " " + this.model[k2].csv.header.padEnd(columnWidth);
        }
      }
      headerLine += "\n";
      console.log(headerLine);

      data.list.forEach((item) => {
        let line = "#";
        for (const k in this.model) {
          let k2 = k as keyof Model<Item>;
          if (this.model[k2] && this.model[k2].csv) {
            switch (this.model[k2].type) {
              case "date":
                const createdDate = formatDate(item[k2] as Date, "YYYY-MM-DD");
                line = line + " " + createdDate.padEnd(columnWidth);
                break;
              case "number":
                line = line + " " + `${item[k2]}VND`.padEnd(columnWidth);
                break;
              default:
                line = line + " " + `${item[k2]}`.padEnd(columnWidth);
                break;
            }
          }
        }
        console.log(line + "\n");
      });
    });
  };

  /**
   * Summary of expenses for a specific month (of current year).
   * @param opts
   * @param command
   */
  summary = (opts: { month?: number }, command: any): void => {
    let month = undefined;

    // Count January to December from 0 but enter command is started with 1
    if (opts.month && opts.month >= 1 && opts.month <= 12) {
      month = opts.month - 1;
    }

    let summary = 0;
    const now = new Date();
    this.service.all().then((data) => {
      data.list
        .filter((item) => {
          if (month) {
            return (
              item.createdAt.getFullYear() == now.getFullYear() &&
              item.createdAt.getMonth() == month
            );
          } else {
            return true;
          }
        })
        .forEach((element) => {
          summary += element.amount;
        });
      console.log(`Total expenses ${month ? ("for "+ MonthMap[month - 1]) : ""}: ${summary}VND`);
    });
  };

  

}

