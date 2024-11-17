import { ICSVRepository } from "../csv";
import { Model } from "../model";

export interface Item {
  id: string;
  description: string;
  amount: number;
  createdAt: Date;
}

export const itemModel: Model<Item> = {
  id: {
    primaryKey: true,
    csv: {
      header: "ID",
    },
    type: "string",
  },
  createdAt: {
    type: "date",
    format: "YYYY-MM-DD",

    csv: {
      header: "Date",
    },
  },
  description: {
    csv: {
      header: "Description",
    },
    type: "string",
  },
  amount: {
    csv: {
      header: "Amount",
    },
    type: "number",
  },
};

export interface SearchResult<T> {
  list: T[];
  total: number;
}

export interface IItemService {
  insert(description: string, amount: number): Promise<number>;
  all(): Promise<SearchResult<Item>>;
  load(id: string): Promise<Item | null>;
  delete(id: string): Promise<number>;
}

export interface IItemRepository extends ICSVRepository<Item> {}
