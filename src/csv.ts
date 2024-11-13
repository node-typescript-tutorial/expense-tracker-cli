import { createReadStream, createWriteStream, statSync } from "fs";
import { createInterface } from "readline";
import { parseDate } from "./date";
import { Model } from "./model";

export interface CSVService<T extends Object> {
  readCSV(): Promise<T[]>;
  writeCSV(data: T[]): void;
  addLine(obj: T): Promise<void>;
}

export class CSVClient<T extends Object> implements CSVService<T> {
  constructor(
    private model: Model<T>,
    private filePath: string,
    private delimiter: string = ","
  ) {
    this.readCSV = this.readCSV.bind(this);
    this.writeCSV = this.writeCSV.bind(this);
    this.getHeaders = this.getHeaders.bind(this);
    this.isFileBlank = this.isFileBlank.bind(this);
    this.addLine = this.addLine.bind(this);
    this.escapeCsvValue = this.escapeCsvValue.bind(this);
    this.parseCsvLine = this.parseCsvLine.bind(this);
    this.getCSVkeys = this.getCSVkeys.bind(this);
  }

  readCSV(): Promise<T[]> {
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

  writeCSV(data: T[]) {
    const writeStream = createWriteStream(this.filePath);

    // Write header for csv
    const { headers } = this.getHeaders();
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
    });
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
    return { headers };
  }

  // check file CSV is blank
  private isFileBlank(): boolean {
    try {
      const stats = statSync(this.filePath);
      return stats.size === 0; // Check if file size is 0
    } catch (err) {
      console.error("Error reading file:", err);
      return false; // Consider the file not blank if there's an error
    }
  }

  // add new line in csv
  async addLine(obj: T) {
    const vals: string[] = [];
    const writeStream = createWriteStream(this.filePath);

    // check headers is existed in csv file
    const { headers } = this.getHeaders();

    if (this.isFileBlank()) {
      // write headers
      const line = headers.join(this.delimiter) + "\n";
      writeStream.write(line);
    }

    for (const k of this.getCSVkeys()) {
      const val = this.escapeCsvValue(`${obj[k] ?? ""}`);
      vals.push(val);
    }

    const line = vals.join(this.delimiter) + "\n";
    writeStream.write(line);

    writeStream.end(() => {
      console.log("CSV file successfully written!");
    });
  }

  // Get keys defined csv prop in Model<T>
  private getCSVkeys() {
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
