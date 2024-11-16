import { Model } from "model";
import { CSVRepository, ICSVRepository } from "../csv";
import { Sequence } from "./sequence";

export interface ISequenceRepository extends ICSVRepository<Sequence> {
}

export class SequenceRepository
  extends CSVRepository<Sequence>
  implements ISequenceRepository
{
  constructor(
    model: Model<Sequence>,
    filePath: string,
    delimiter: string = ","
  ) {
    super(model, filePath, delimiter);
  }
}
