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

  next(name: string): Promise<number> {
    return this.repo.insert({
      name: name,
      sequenceNumber: 1,
    });
  }
  async getSequenceNo(name: string): Promise<number> {
    return this.repo.load({name: name}).then((data)=> data.sequenceNumber)
  }
}
