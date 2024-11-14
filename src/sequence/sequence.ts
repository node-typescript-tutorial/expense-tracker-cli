import { Model } from "src/model";

export interface Sequence {
  name: string;
  sequenceNumber: number;
}

export const SequenceModel: Model<Sequence> = {
  name: {
    csv: {
      header: "Name",
    },
    type: "string",
    primaryKey: true,
  },
  sequenceNumber: {
    csv: {
      header: "Sequence",
    },

    type: "number",
  },
};
