import {
  appendFileSync,
  createReadStream,
  createWriteStream,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { createInterface, Interface, ReadLineOptions } from "readline";
import { formatDate, parseDate } from "./date";
import { getCSVProp, Model } from "./model";

export interface ICSVRepository<T extends Object> {
  all(): Promise<T[]>;
  load(props: Record<string, any>): Promise<T | null>;
  insertMany(data: T[]): Promise<number>;
  insert(obj: T): Promise<number>;
  update(
    map: Record<string, any>,
    keyprops: Record<string, any>
  ): Promise<number>;
  delete(props: Record<string, any>): Promise<number>;
}

export class CSVRepository<T extends Object> implements ICSVRepository<T> {
  // Primary keys in CSV Data
  private pks: {
    list: string[];
    keyIndexes: Record<string, number>;
  } = {
    list: [],
    keyIndexes: {},
  };

  constructor(
    private model: Model<T>,
    private filePath: string,
    private delimiter: string = ","
  ) {
    this.pks = this.primaryKeys();

    this.all = this.all.bind(this);
    this.insertMany = this.insertMany.bind(this);
    this.insert = this.insert.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.headers = this.headers.bind(this);
    this.isFileBlank = this.isFileBlank.bind(this);
    this.escapeCsvValue = this.escapeCsvValue.bind(this);
    this.parseCsvLine = this.parseCsvLine.bind(this);
    this.getCSVProps = this.getCSVProps.bind(this);
    this.primaryKeys = this.primaryKeys.bind(this);
    this.propIndexes = this.propIndexes.bind(this);
    this.createReadLineInterface = this.createReadLineInterface.bind(this);
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

      const rl = this.createReadLineInterface();

      rl.on("line", (line: string) => {
        if (headers.length == 0) {
          // Handle header row in CSV
          this.parseCsvLine(line).forEach((cell) => {
            if (!headerPropMap[cell]) {
              return reject(`header ${cell} isn't existed`);
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
            // Parse value from csv
            if (this.model[prop] && this.model[prop].csv) {
              switch (this.model[prop].type) {
                case "string":
                  rawData[prop] = row[i];
                  break;
                case "number":
                  rawData[prop] = parseFloat(row[i]);
                case "date":
                  rawData[prop] = parseDate(row[i], this.model[prop]?.format);

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
  load(pkVals: Record<string, any>): Promise<T | null> {
    return new Promise(async (resolve, reject) => {
      // Validate primary keys
      for (const key of this.pks.list) {
        if (!pkVals[key]) {
          return reject("Missing primary key value for loading data");
        }
      }

      let isHeaderLine = true;
      let result: T | null = null;
      const rl = this.createReadLineInterface();

      try {
        for await (const line of rl) {
          if (isHeaderLine) {
            isHeaderLine = false;
            continue;
          }

          let isMatch = true;
          const row = line.split(this.delimiter);

          // check primary key values
          for (const k in this.pks.keyIndexes) {
            const index = this.pks.keyIndexes[k];
            let v: any = row[index];

            const k2 = k as keyof Model<T>;

            if (this.model[k2] && this.model[k2].type) {
              switch (this.model[k2].type) {
                case "string":
                  break;
                case "number":
                  v = parseFloat(v);
                  break;
                case "date":
                  v = parseDate(v, this.model[k2]?.format);
                  break;
                default:
                  break;
              }
            } else {
              isMatch = false;
              break; // no need to processing in this line
            }

            if (v !== pkVals[k]) {
              isMatch = false;
              break; // no need to processing in this line
            }
          }

          if (isMatch) {
            const rawData: { [key: string]: any } = {};

            Object.keys(this.model).forEach((k, idx) => {
              // parse value
              let k2 = k as keyof Model<T>;
              let v: any = row[idx];
              switch (this.model[k2] && this.model[k2].type) {
                case "string":
                  break;
                case "number":
                  v = parseFloat(v);
                  break;
                case "date":
                  v = parseDate(v, this.model[k2]?.format);
                  break;
                default:
                  break;
              }
              rawData[k] = v;
            });
            result = rawData as T;
            break; // No need to continue processing once a match is found
          }
        }

        resolve(result);
      } catch (e) {
        console.error("Error loading data:", e);
        reject(e);
      }
    });
  }

  // Insert new item in csv
  async insert(obj: T): Promise<number> {
    return new Promise((resolve, reject) => {
      const vals: string[] = [];

      // Check headers is existed in csv file
      const headers = this.headers();

      if (this.isFileBlank()) {
        // Write headers
        const line = headers.join(this.delimiter) + "\n";
        try {
          appendFileSync(this.filePath, line);
        } catch (e) {
          console.log("ERROR: ", e);
          return reject(e);
        }
      }

      let convertVal = "";
      for (const k of this.getCSVProps()) {
        switch (this.model[k]?.type) {
          case "date":
            if (this.model[k].format) {
              const dateString = formatDate(
                obj[k] as Date,
                this.model[k].format
              );
              convertVal = this.escapeCsvValue(`${dateString}`);
            }
            break;
          case "string":
          case undefined:
          case "number":
            convertVal = this.escapeCsvValue(`${obj[k] ?? ""}`);
            break;
        }
        vals.push(convertVal);
      }

      const line = vals.join(this.delimiter) + "\n";
      try {
        const res = appendFileSync(this.filePath, line);
        return resolve(1);
      } catch (e) {
        console.log("ERROR: ", e);
        return reject(e);
      }
    });
  }

  // Write to blank CSV file
  insertMany(data: T[]): Promise<number> {
    return new Promise((resolve, rejects) => {
      const writeStream = createWriteStream(this.filePath);

      // Write header for csv
      const headers = this.headers();
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

  // Update 1 line in csv data
  update(
    map: Record<string, any>,
    props: Record<string, any>
  ): Promise<number> {
    return new Promise(async (resolve, reject) => {
      for (const key of this.pks.list) {
        if (!props[key]) {
          return reject("less primary key value for load data");
        }
      }

      const { keyIndexes } = this.pks;
      const propIndexes = this.propIndexes();
      const rl = this.createReadLineInterface();

      const tempFilePath = `${this.filePath}.tmp`;
      const writeStream = createWriteStream(tempFilePath);

      let lineNumber = 0;
      let isHeaderLine = true;

      for await (const line of rl) {
        let founded = true;
        if (isHeaderLine) {
          writeStream.write(line + "\n");
          isHeaderLine = false;
        } else {
          const row = line.split(this.delimiter);

          // Find row which has value have the same priary key
          for (const k in keyIndexes) {
            // parse value
            let v: any = row[keyIndexes[k]];
            const k2 = k as keyof Model<T>;
            switch (this.model[k2] && this.model[k2].type) {
              case "string":
                break;
              case "number":
                v = parseFloat(v);
                break;
              case "date":
                v = parseDate(v, this.model[k2]?.format);
              default:
                break;
            }

            if (v !== props[k]) {
              founded = false;
              break;
            } else {
              continue;
            }
          }

          if (founded) {
            for (let item in map) {
              if (!(item in propIndexes)) {
                return reject("Wrong property for update: " + item);
              } else {
                const k2 = item as keyof Model<T>;
                if (
                  this.model[k2] &&
                  this.model[k2].csv &&
                  !this.model[k2].primaryKey
                ) {
                  switch (this.model[k2]?.type) {
                    case "date":
                      if (this.model[k2].format) {
                        const dateString = formatDate(
                          map[item] as Date,
                          this.model[k2].format
                        );
                        row[propIndexes[item]] = this.escapeCsvValue(
                          `${dateString}`
                        );
                      }
                      break;
                    case "string":
                    case undefined:
                    case "number":
                      row[propIndexes[item]] = this.escapeCsvValue(
                        `${map[item]}`
                      );
                      break;
                  }
                }

                // Join the lines back into a single string
                const newLine = row.join(this.delimiter) + "\n";

                // Write the updated content back to the file line
                writeStream.write(newLine);
              }
            }
          } else {
            // Write the original line
            writeStream.write(line + "\n");
          }
        }
        lineNumber++;
      }

      // Close the streams
      writeStream.end(() => {
        // Remove the original file
        unlinkSync(this.filePath);
        // rename the temporary file to the original file
        renameSync(tempFilePath, this.filePath);
        console.log("line updated successfully.");
        resolve(1);
      });
    });
  }

  async delete(props: Record<string, any>): Promise<number> {
    const tempFilePath = `${this.filePath}.tmp`;
    const writeStream = createWriteStream(tempFilePath);
    const readStream = createReadStream(this.filePath);
    const rl = createInterface({
      input: readStream,
      output: writeStream,
      terminal: false,
    });

    try {
      let rowDeleted = 0;
      let isHeaderLine = true;
      const { keyIndexes } = this.pks;

      for await (const line of rl) {
        if (isHeaderLine) {
          writeStream.write(line + "\n");
          isHeaderLine = false;
          continue;
        }

        const row = line.split(this.delimiter);
        let isMatch = true;

        // Find row which has value have the same priary key
        for (const k in keyIndexes) {
          // parse value
          let v: any = row[keyIndexes[k]];
          const k2 = k as keyof Model<T>;
          if (this.model[k2] && this.model[k2].type) {
            switch (this.model[k2].type) {
              case "string":
                break;
              case "number":
                v = parseFloat(v);
                break;
              case "date":
                v = parseDate(v, this.model[k2]?.format);
                break;
              default:
                break;
            }
          } else {
            isMatch = false;
            break;
          }

          if (v !== props[k]) {
            isMatch = false;
            break;
          } else {
            console.log("v: ", isMatch);
            continue;
          }
        }

        // If found go through not write to file, else write line to file
        if (!isMatch) {
          writeStream.write(line + "\n");
        } else {
          rowDeleted++;
        }
      }

      readStream.close();
      writeStream.end();

      // Replace the original file with the new file
      renameSync(tempFilePath, this.filePath);

      console.log("rowDeleted: ", rowDeleted);

      return rowDeleted;
    } catch (err) {
      readStream.close();
      writeStream.end();
      console.error("Error processing file:", err);
      throw err;
    }
  }

  // create read line interface
  private createReadLineInterface(
    filePath: string = this.filePath,
    rlOpts?: ReadLineOptions
  ): Interface {
    const readStream = createReadStream(this.filePath);
    const defaultOpts: ReadLineOptions = {
      input: readStream,
    };
    const rl = createInterface({ ...defaultOpts, ...rlOpts });
    return rl;
  }

  // Get key indexes
  private propIndexes() {
    const csvProps = this.getCSVProps();
    let propIdxs: Record<string, number> = {};
    csvProps.forEach((k, idx) => {
      const k2 = k as keyof T;
      if (this.model[k2] && this.model[k2]!.csv) {
        propIdxs[k] = idx;
      }
    });

    return propIdxs;
  }
  // Get properties identified primary key
  private primaryKeys(): {
    list: string[];
    keyIndexes: Record<string, number>;
  } {
    const keys: string[] = [];
    const indexesMap: Record<string, number> = {};
    let count = 0;
    for (const prop in this.model) {
      if (this.model[prop] && this.model[prop].primaryKey == true) {
        keys.push(prop);
        indexesMap[prop] = count;
        count++;
      }
    }

    return { list: keys, keyIndexes: indexesMap };
  }

  // Get headers from model
  private headers(isEscapeCsvValue: boolean = true) {
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
  private getCSVProps(): Extract<keyof T, string>[] {
    const csvKeys: Extract<keyof T, string>[] = [];
    for (const key in this.model) {
      if (this.model[key] && this.model[key].csv) {
        csvKeys.push(key);
      }
    }
    return csvKeys;
  }

  /**
   * Escape and quote fields that contain commas, newlines, or quotes.
   * @param value - field contain comams, newlines, or quotes.
   * @return The escaped and quoted field.
   */
  private escapeCsvValue(value: string): string {
    if (value.includes('"') || value.includes(",") || value.includes("\n")) {
      value = value.replace(/"/g, '""');
      value = `"${value}"`;
    }
    return value;
  }

  /**
   * Parse a line in csv to array of string field.
   * example 1: `"something to, say","lorem in pulse",rock,`, to ['something to, say', 'lorem in pulse', 'rock'].
   * example 2: """something"", to ""say""", "give me your "heart""", to ['"something" to, "say"', 'give me your "heart"' ].
   *
   * @param line - line in CSV file.
   * @param delimiter - the separate sympol between value in CSV line.
   * @returns the list of values after separate by delimeter.
   */
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
        currentField = "";
      } else {
        currentField += char;
      }
    }

    return result;
  }
}
