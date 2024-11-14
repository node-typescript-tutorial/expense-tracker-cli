import { ISequenceRepository } from "./sequence_repository";

export interface SequenceService {
  next(name: string): Promise<number>;
  getSequenceNo(name: string): Promise<number>;
}

export class SequenceClient implements SequenceService {
  constructor(private repo: ISequenceRepository) {
    this.next = this.next.bind(this);
    this.getSequenceNo = this.getSequenceNo.bind(this);
  }

  async next(name: string): Promise<number> {
    const res = await this.repo.load({ name: name });
    if (res == null) {
      return this.repo
        .insert({
          name: name,
          sequenceNumber: 1,
        })
        .then(() => 1);
    } else {
      return this.repo
        .update({ sequenceNumber: res.sequenceNumber + 1 }, { name: name })
        .then(() => res.sequenceNumber + 1);
    }
  }
  async getSequenceNo(name: string): Promise<number> {
    return this.repo.load({ name: name }).then((data) => data.sequenceNumber);
  }
}
