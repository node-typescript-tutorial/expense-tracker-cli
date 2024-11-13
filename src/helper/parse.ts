// Helper function to parse command line input while preserving quoted strings
export function parseCommandLine(input: string): string[] {
  const regex = /[^\s"]+|"([^"]+)"/g;
  const matches = input.match(regex);
  return matches ? matches.map((match) => match.replace(/"/g, "")) : [];
}
