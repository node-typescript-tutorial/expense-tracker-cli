const fs = require('fs');
const readline = require('readline');

function readCSV(filePath: string) {
  const readStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity
  });

  rl.on('line', (line: string) => {
    const row = line.split(',');
    console.log(row);
  });

  rl.on('close', () => {
    console.log('Finished reading the file.');
  });
}


function writeCSV(filePath: string, data: string[][]) {
  const writeStream = fs.createWriteStream(filePath);
  
  data.forEach(row => {
    const line = row.join(',') + '\n';
    writeStream.write(line);
  });

  writeStream.end(() => {
    console.log('CSV file successfully written!');
  });
}

// Usage
const dataToWrite = [
  ['Name', 'Age', 'City'],
  ['John Doe', '30', 'New York'],
  ['Jane Doe', '25', 'Los Angeles']
];

writeCSV('path/to/your/output.csv', dataToWrite);

