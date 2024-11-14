import { CSVRepository } from "src/csv";
import { IItemRepository, Item } from "./item";

export class ItemRepository
  extends CSVRepository<Item>
  implements IItemRepository {}