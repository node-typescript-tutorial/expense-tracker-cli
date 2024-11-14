import { CSVRepository, ICSVRepository } from "src/csv";
import { Sequence } from "./sequence";
import { Model } from "src/model";

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
