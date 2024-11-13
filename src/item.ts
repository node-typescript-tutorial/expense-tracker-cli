import { Model } from "./model";

export interface Item {
  id: string;
  description: string;
  amount: number;
  createdAt: Date;
}

export const itemModel: Model<Item> = {
  id: {
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
    type: "string",
  },
};
