const dateFormats = [
  "DD/MM/YYYY",
  "MM/DD/YY",
  "DD.MM.YYYY",
  "MM.DD.YYYY",
  "DD-MM-YYYY",
  "YYYY/MM/DD",
  "YYYY-MM-DD",
  "DD/MM/YY",
  "MM/DD/YY",
  "DD Mon, YYYY",
] as const;



type DateFormat = (typeof dateFormats)[number];

type DateRegexs = {
  [key in DateFormat]: RegExp;
};

type MonthAbbreviationMap = {
  [key: string]: number;
};

const monthAbbreviation: MonthAbbreviationMap = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  June: 5,
  July: 6,
  Aug: 7,
  Sept: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

export const dateRegexs: DateRegexs = {
  "YYYY-MM-DD": new RegExp(
    "^(?<year>\\d{4})-(?<month>(0[1-9]|1[0-2]))-(?<date>(0[1-9]|1[0-9]|2[0-9]|3[01]))$"
  ),
  "DD/MM/YYYY": new RegExp(
    "^(?<date>(0[1-9]|1[0-9]|2[0-9]|3[0-1]))\\/(?<month>(0[1-9]|1[0-2]))\\/(?<year>\\d{4})$"
  ),
  "DD.MM.YYYY": new RegExp(
    "^(?<date>(0[1-9]|1[0-9]|2[0-9]|3[0-1]))\\.(?<month>(0[1-9]|1[0-2]))\\.(?<year>\\d{4})$"
  ),
  "DD-MM-YYYY": new RegExp(
    "^(?<date>)(0[1-9]|1[0-9]|2[0-9]|3[0-1])-(?<month>(0[1-9]|1[0-2]))"
  ),
  "MM/DD/YY": new RegExp(
    "^(?<month>(0[1-9]|1[0-2]))\\/(?<date>(0[1-9]|1[0-9]|2[0-9]|3[0-1]))\\/(?<year>\\d{2})$"
  ),
  "MM.DD.YYYY": new RegExp(
    "^(?<month>(0[1-9]|1[0-2]))\\.(?<date>(0[1-9]|1[0-9]|2[0-9]|3[0-1]))\\.(?<year>\\d{4})$"
  ),
  "YYYY/MM/DD": new RegExp(
    "^(?<year>\\d{4})\\/(?<month>(0[1-9]|1[0-2]))\\/(?<date>(0[1-9]|1[0-9]|2[0-9]|3[0-1]))$"
  ),
  "DD/MM/YY": new RegExp(
    "^(?<date>(0[1-9]|1[0-9]|2[0-9]|3[0-1]))\\/(?<month>(0[1-9]|1[0-2]))\\/(?<year>\\d{2})$"
  ),
  "DD Mon, YYYY": new RegExp(
    "^(?<date>(0[1-9]|1[0-9]|2[0-9]|3[0-1]))\\s(?<month>(Feb|Jan|Mar|Apr|May|June|July|Aug|Sept|Oct|Nov|Dec))[,]\\s(?<year>\\d{4})$"
  ),
};

type RegexDateGroup = {
  date: string;
  month: string;
  year: string;
};

// Enter a string with format date of this string and return a date
// Example: string '20-04-2020' with format  "dd-mm-yyyy" => Date(2020,3,20)
export const parseDate = (str: string, format: string = "DD/MM/YYYY") => {
  // check is valid format, if not return null
  const validFormat = dateFormats.find((validFormat) => validFormat === format);
  if (validFormat === undefined) {
    return null;
  }

  let dateGroup: Partial<RegexDateGroup> | undefined =
    dateRegexs[validFormat].exec(str)?.groups;
  switch (validFormat) {
    case "DD Mon, YYYY":
      if (!dateGroup || !dateGroup.year || !dateGroup.date || !dateGroup.month)
        return null;
      return new Date(
        parseFloat(dateGroup.year),
        monthAbbreviation[dateGroup.month],
        parseFloat(dateGroup.date)
      );
    default:
      dateGroup = dateRegexs[validFormat].exec(str)?.groups;

      if (!dateGroup || !dateGroup.year || !dateGroup.date || !dateGroup.month)
        return null;
      return new Date(
        parseFloat(dateGroup.year),
        parseFloat(dateGroup.month) - 1,
        parseFloat(dateGroup.date)
      );
  }
};

// If formatType is not valid/covered => ""
export const formatDate = (date: Date, formatType: string): string => {
  // Check is valid format, if not return null
  const validFormat = dateFormats.find(
    (validFormat) => validFormat === formatType
  );
  if (!validFormat) {
    return "";
  }
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  const dateString = formatType
    .replace("YYYY", `${year}`)
    .replace("YY", `${year}`.padEnd(2, "0"))
    .replace("MM", `${month}`.padStart(2, "0"))
    .replace("DD", `${day}`.padStart(2, "0"));
  return dateString;
};
