import { createReadStream, createWriteStream, Mode } from "fs";
import { createInterface } from "readline";
import { parseDate } from "./date";
import { Model } from "./model";

export function readCSV<T extends Object>(
  filePath: string,
  model: Model<T>
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const result: T[] = [];
    let headers: string[] = [];

    const headerPropMap: {
      [key: string]: { prop: string };
    } = {};
    const ks = Object.keys(model).forEach((k, idx) => {
      let k2 = k as keyof Model<T>;
      if (model[k2] && model[k2].csv) {
        headerPropMap[model[k2].csv.header] = {
          prop: k,
        };
      }
    });

    const readStream = createReadStream(filePath);
    const rl = createInterface({
      input: readStream,
      crlfDelay: Infinity,
    });

    rl.on("line", (line: string) => {
      if (headers.length == 0) {
        // Handle header row in CSV
        line.split(",").forEach((cell) => {
          cell = cell.trim();
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

        const row = line.split(",");
        for (let i = 0; i < headers.length; i++) {
          const prop = headerPropMap[headers[i]].prop as keyof Model<T> & string;
          if (model[prop] && model[prop].csv) {
            switch (model[prop].csv.type) {
              case "string":
                rawData[prop] = row[i];
                break;
              case "number":
                rawData[prop] = parseFloat(row[i]);
              case "date":
                rawData[prop] = parseDate(row[i], "YYYY-MM-DD")
              default:
                break;
            }
          }
        }
        result.push(rawData as T)
      }
    });

    rl.on("close", () => {
      console.log("Finished reading the file.");
      resolve(result)
    });
  });
}

export function writeCSV(filePath: string, data: string[][]) {
  const writeStream = createWriteStream(filePath);

  data.forEach((row) => {
    const line = row.join(",") + "\n";
    writeStream.write(line);
  });

  writeStream.end(() => {
    console.log("CSV file successfully written!");
  });
}
