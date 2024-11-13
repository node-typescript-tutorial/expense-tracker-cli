import {
  createReadStream,
  createWriteStream,
  statSync,
} from "fs";
import { createInterface } from "readline";
import { parseDate } from "./date";
import { Model, getCSVProp } from "./model";

export function readCSV<T extends Object>(
  filePath: string,
  model: Model<T>,
  delimiter: string = ","
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const result: T[] = [];
    let headers: string[] = [];

    const headerPropMap: {
      [key: string]: { prop: string };
    } = {};

    for (const k in model) {
      let k2 = k as keyof Model<T>;
      if (model[k2] && model[k2].csv) {
        headerPropMap[model[k2].csv.header] = {
          prop: k,
        };
      }
    }

    const readStream = createReadStream(filePath);
    const rl = createInterface({
      input: readStream,
      crlfDelay: Infinity,
    });

    rl.on("line", (line: string) => {
      if (headers.length == 0) {
        // Handle header row in CSV
        parseCsvLine(line).forEach((cell) => {
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

        const row = line.split(delimiter);
        for (let i = 0; i < headers.length; i++) {
          const prop = headerPropMap[headers[i]].prop as keyof Model<T> &
            string;
          if (model[prop] && model[prop].csv) {
            switch (model[prop].type) {
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

export function writeCSV<T extends Object>(
  filePath: string,
  data: T[],
  model: Model<T>,
  delimiter: string = ","
) {
  const writeStream = createWriteStream(filePath);

  // Write header for csv
  const { headers } = getHeaders(model);
  writeStream.write(headers.join(delimiter));

  // Write data to csv
  data.forEach((item) => {
    const vals: string[] = [];

    for (const key in item) {
      const val = escapeCsvValue(`${item[key] ?? ""}`);
      vals.push(val);
    }

    const line = vals.join(delimiter) + "\n";
    writeStream.write(line);
  });

  writeStream.end(() => {
    console.log("CSV file successfully written!");
  });
}

// Get headers from model
function getHeaders<T extends Object>(
  model: Model<T>,
  isEscapeCsvValue: boolean = true
) {
  const headers: string[] = [];
  for (const key in model) {
    if (model[key] && model[key].csv) {
      const { header } = model[key].csv;
      const v = isEscapeCsvValue ? escapeCsvValue(header) : header;
      headers.push(v);
    }
  }
  return { headers };
}

// check file CSV is blank
function isFileBlank(filePath: string): boolean {
  try {
    const stats = statSync(filePath);
    return stats.size === 0; // Check if file size is 0
  } catch (err) {
    console.error("Error reading file:", err);
    return false; // Consider the file not blank if there's an error
  }
}

// add new line in csv
export async function addLine<T extends Object>(
  delimiter: string = ",",
  obj: T,
  model: Model<T>,
  filePath: string
) {
  const vals: string[] = [];
  const writeStream = createWriteStream(filePath);

  // check headers is existed in csv file
  const { headers } = getHeaders(model);

  if (isFileBlank(filePath)) {
    // write headers
    const line = headers.join(delimiter) + "\n";
    writeStream.write(line);
  }

  for (const k in getCSVProp(model)) {
    const val = escapeCsvValue(`${obj[k] ?? ""}`);
    vals.push(val);
  }

  const line = vals.join(delimiter) + "\n";
  writeStream.write(line);

  writeStream.end(() => {
    console.log("CSV file successfully written!");
  });
}

// Escape and quote fields that contain commas, newlines, or quotes
function escapeCsvValue(value: string): string {
  if (value.includes('"') || value.includes(",") || value.includes("\n")) {
    value = value.replace(/"/g, '""');
    value = `"${value}"`;
  }
  return value;
}

// Parse a line in csv to array of string field
// example 1: `"something to, say","lorem in pulse",rock,`, to ['something to, say', 'lorem in pulse', 'rock']
// example 2: """something"", to ""say""", "give me your "heart""", to ['"something" to, "say"', 'give me your "heart"' ]
function parseCsvLine(line: string, delimiter: string = ","): string[] {
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
