import { CSVService } from "src/csv";
import { Item } from "./item";

export class ItemClient implements IItemService {
  constructor(private csvService: CSVService<Item>) {
    this.add = this.add.bind(this);
  }

  add(description: string, amount: number) {
    const item: Item = {
        id: "1",
        description: description,
        amount: amount,
        createdAt: new Date()
    }
    this.csvService.addLine(item);
  }
}

export interface IItemService {
  add(description: string, amount: number): void;
}
