export type Model<T> = {
  [key in keyof Partial<T>]: ModelProp;
};

interface ModelProp {
  csv: CSVProp;
}

interface CSVProp {
  header: string;
  type: ColType;
  format?: string;
}

export type ColType = "number" | "string" | "date";
