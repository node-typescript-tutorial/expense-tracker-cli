import { ISequenceRepository } from "./repository";

export interface SequenceService {
  next(name: string): Promise<number>;
  getSequenceNo(name: string): Promise<number>;
}

export class SequenceClient implements SequenceService {
  constructor(private repo: ISequenceRepository) {
    this.next = this.next.bind(this);
    this.getSequenceNo = this.getSequenceNo.bind(this);
  }

  // Return the next id number
  async next(name: string): Promise<number> {
    return this.repo
      .load({ name: name })
      .then(async (res) => {
        
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
      })
      .catch((e) => {
        throw e;
      });
  }
  async getSequenceNo(name: string): Promise<number> {
    return this.repo.load({ name: name }).then((data) => {
      if (!data) {
        return Promise.reject("sequence not found");
      } else {
        return data.sequenceNumber;
      }
    });
  }
}
