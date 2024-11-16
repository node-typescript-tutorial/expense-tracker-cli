import { IItemRepository, IItemService, Item, SearchResult } from "./item";

export class ItemClient implements IItemService {
  constructor(
    private csvService: IItemRepository,
    private generateId: () => Promise<string>
  ) {
    this.insert = this.insert.bind(this);
    this.all = this.all.bind(this);
    this.load = this.load.bind(this);
  }

  async all(): Promise<SearchResult<Item>> {
    return this.csvService.all().then((result) => {
      return {
        list: result,
        total: result.length,
      };
    });
  }

  async load(id: string): Promise<Item | null> {
    return this.csvService.load({ id: id });
  }

  async insert(description: string, amount: number): Promise<number> {
    try {
      const id = await this.generateId();

      const item: Item = {
        id: id,
        description: description,
        amount: amount,
        createdAt: new Date(),
      };
      return this.csvService.insert(item);
    } catch (error) {
      throw error;
    }
  }

  async delete(id: string): Promise<number> {
    return this.csvService.delete({ id: id });
  }
}
