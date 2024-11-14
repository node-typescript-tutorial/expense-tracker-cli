export type Model<T> = {
  [key in keyof Partial<T>]: ModelProp;
};

interface ModelProp {
  csv: CSVProp;
  type: ModelType;
  format?: string;
  primaryKey?: boolean;
}

interface CSVProp {
  header: string;
}

export type ModelType = "number" | "string" | "date";

type CSVMap<T> = {
  [K in keyof Model<T>]: CSVProp;
};

export const getCSVProp = <T extends Object>(model: Model<T>): CSVMap<T> => {
  const csvMap = {} as CSVMap<T>;
  for (const key in model) {
    if (model[key] && model[key].csv) {
      csvMap[key] = model[key].csv;
    }
  }
  return csvMap;
};
