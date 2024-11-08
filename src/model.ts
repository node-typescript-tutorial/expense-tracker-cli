export type Model<T> = {
  [key in keyof Partial<T>]: ModelProp;
};

interface ModelProp {
  csv: CSVProp;
}

interface CSVProp {
  header: string;
  type: "number" | "string" | "date";
  format?: string;
}
