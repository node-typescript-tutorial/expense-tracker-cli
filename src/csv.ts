import { createReadStream, createWriteStream, statSync } from "fs";
import { createInterface } from "readline";
import { parseDate } from "./date";
import { Model } from "./model";
import { rejects } from "assert";
import { resolve } from "path";

export interface ICSVRepository<T extends Object> {
  all(): Promise<T[]>;
  load(props: { [key: string]: any }): Promise<T>;
  insertMany(data: T[]): Promise<number>;
  insert(obj: T): Promise<number>;
}

export class CSVRepository<T extends Object> implements ICSVRepository<T> {
  // Primary keys in CSV Data
  private pks: (keyof Model<T>)[] = [];

  constructor(
    private model: Model<T>,
    private filePath: string,
    private delimiter: string = ","
  ) {
    this.all = this.all.bind(this);
    this.insertMany = this.insertMany.bind(this);
    this.getHeaders = this.getHeaders.bind(this);
    this.isFileBlank = this.isFileBlank.bind(this);
    this.insert = this.insert.bind(this);
    this.escapeCsvValue = this.escapeCsvValue.bind(this);
    this.parseCsvLine = this.parseCsvLine.bind(this);
    this.getCSVProps = this.getCSVProps.bind(this);
    this.getPrimaryKeys = this.getPrimaryKeys.bind(this);
    this.pks = this.getPrimaryKeys();
  }

  // Load all data in CSV
  all(): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const result: T[] = [];
      let headers: string[] = [];

      const headerPropMap: {
        [key: string]: { prop: string };
      } = {};

      for (const k in this.model) {
        let k2 = k as keyof Model<T>;
        if (this.model[k2] && this.model[k2].csv) {
          headerPropMap[this.model[k2].csv.header] = {
            prop: k,
          };
        }
      }

      const readStream = createReadStream(this.filePath);
      const rl = createInterface({
        input: readStream,
        crlfDelay: Infinity,
      });

      rl.on("line", (line: string) => {
        if (headers.length == 0) {
          // Handle header row in CSV
          this.parseCsvLine(line).forEach((cell) => {
            if (!headerPropMap[cell]) {
              reject(`header ${cell} isn't existed`);
              return;
            } else {
              headers.push(cell);
            }
          });
        } else {
          // handle row in csv
          const rawData: { [key: string]: any } = {};

          const row = line.split(this.delimiter);
          for (let i = 0; i < headers.length; i++) {
            const prop = headerPropMap[headers[i]].prop as keyof Model<T> &
              string;
            if (this.model[prop] && this.model[prop].csv) {
              switch (this.model[prop].type) {
                case "string":
                  rawData[prop] = row[i];
                  break;
                case "number":
                  rawData[prop] = parseFloat(row[i]);
                case "date":
                  rawData[prop] = parseDate(row[i], "YYYY-MM-DD");
                default:
                  break;
              }
            }
          }
          result.push(rawData as T);
        }
      });

      rl.on("close", () => {
        console.log("Finished reading the file.");
        resolve(result);
      });
    });
  }

  // Load item with primary key values
  load(props: Partial<Model<T>>): Promise<T> {
    return new Promise((resolve, reject) => {
      // Looping all primary keys for validate
      for (const key of this.pks) {
        if (!props[key]) {
          return Promise.reject("less primary key value for load data");
        }
      }

      let result = null as T | null;

      const readStream = createReadStream(this.filePath);
      const rl = createInterface({
        input: readStream,
        crlfDelay: Infinity,
      });

      let isHeader = true;
      const headers = this.getHeaders();
      headers.forEach((v, idx) => {
        if (this.pks.includes(v as keyof T)) {
        }
      });

      rl.on("line", (line: string) => {
        // handle row in csv
        if (isHeader == true) {
          isHeader = false;
        } else {
          const rawData: { [key: string]: any } = {};

          const row = line.split(this.delimiter);
        }
      });

      rl.on("close", () => {
        console.log("Finished reading the file.");
        if (!result) {
          reject("data is not existed");
        }
        resolve(result as T);
      });
    });
  }

  // Insert new item in csv
  async insert(obj: T): Promise<number> {
    return new Promise((resolve, reject) => {
      const vals: string[] = [];
      const writeStream = createWriteStream(this.filePath);

      // Check headers is existed in csv file
      const headers = this.getHeaders();

      if (this.isFileBlank()) {
        // Write headers
        const line = headers.join(this.delimiter) + "\n";
        writeStream.write(line);
      }

      for (const k of this.getCSVProps()) {
        const val = this.escapeCsvValue(`${obj[k] ?? ""}`);
        vals.push(val);
      }

      const line = vals.join(this.delimiter) + "\n";
      writeStream.write(line);

      writeStream.end(() => {
        console.log("CSV file successfully written!");
        Promise.resolve(1);
      });
    });
  }

  // Write to blank CSV file
  insertMany(data: T[]): Promise<number> {
    return new Promise((resolve, rejects) => {
      const writeStream = createWriteStream(this.filePath);

      // Write header for csv
      const headers = this.getHeaders();
      writeStream.write(headers.join(this.delimiter));

      // Write data to csv
      data.forEach((item) => {
        const vals: string[] = [];

        for (const key in item) {
          const val = this.escapeCsvValue(`${item[key] ?? ""}`);
          vals.push(val);
        }

        const line = vals.join(this.delimiter) + "\n";
        writeStream.write(line);
      });

      writeStream.end(() => {
        console.log("CSV file successfully written!");
        resolve(1);
      });
    });
  }

  // get properties identified primary key
  private getPrimaryKeys() {
    const keys: (keyof Model<T>)[] = [];
    for (const prop in this.model) {
      if (this.model[prop] && this.model[prop].primaryKey == true) {
        keys.push(prop);
      }
    }

    return keys;
  }

  // Get headers from model
  private getHeaders(isEscapeCsvValue: boolean = true) {
    const headers: string[] = [];
    for (const key in this.model) {
      if (this.model[key] && this.model[key].csv) {
        const { header } = this.model[key].csv;
        const v = isEscapeCsvValue ? this.escapeCsvValue(header) : header;
        headers.push(v);
      }
    }
    return headers;
  }

  // Check file CSV is blank
  private isFileBlank(): boolean {
    try {
      const stats = statSync(this.filePath);
      return stats.size === 0; // Check if file size is 0
    } catch (err) {
      console.error("Error reading file:", err);
      return false; // Consider the file not blank if there's an error
    }
  }

  // Get keys defined csv prop in Model<T>
  private getCSVProps() {
    const csvKeys: Extract<keyof T, string>[] = [];
    for (const key in this.model) {
      if (this.model[key] && this.model[key].csv) {
        csvKeys.push(key);
      }
    }
    return csvKeys;
  }

  // Escape and quote fields that contain commas, newlines, or quotes
  private escapeCsvValue(value: string): string {
    if (value.includes('"') || value.includes(",") || value.includes("\n")) {
      value = value.replace(/"/g, '""');
      value = `"${value}"`;
    }
    return value;
  }

  // Parse a line in csv to array of string field
  // example 1: `"something to, say","lorem in pulse",rock,`, to ['something to, say', 'lorem in pulse', 'rock']
  // example 2: """something"", to ""say""", "give me your "heart""", to ['"something" to, "say"', 'give me your "heart"' ]
  private parseCsvLine(line: string, delimiter: string = ","): string[] {
    const result: string[] = [];
    let inQuotes = false; // flag to check we're inside a quoted field
    let currentField = "";

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        // near end line 1 char
        if (i + 1 < line.length && line[i + 1] == '"') {
          currentField += '"';
        } else {
          inQuotes = false;
        }
      } else if (char == delimiter && !inQuotes) {
        result.push(currentField);
      } else {
        currentField += char;
      }
    }
    return result;
  }
}
