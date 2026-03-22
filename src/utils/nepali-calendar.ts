export interface NepaliMonthData {
  [key: number]: number[];
}

const START_ENGLISH_DATE = "1943-04-14";
const START_NEPALI_DATE = "2000-01-01";
const MIN_YEAR_BS = 2000;
const MAX_YEAR_BS = 2090;

export const nepaliMonthData: NepaliMonthData = {
  "2000": [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  "2001": [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  "2002": [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  "2003": [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  "2004": [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  "2005": [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  "2006": [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  "2007": [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  "2008": [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  "2009": [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  "2010": [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  "2011": [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  "2012": [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  "2013": [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  "2014": [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  "2015": [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  "2016": [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  "2017": [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  "2018": [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  "2019": [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  "2020": [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  "2021": [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  "2022": [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  "2023": [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  "2024": [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  "2025": [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  "2026": [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  "2027": [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  "2028": [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  "2029": [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
  "2030": [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  "2031": [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  "2032": [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  "2033": [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  "2034": [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  "2035": [30, 32, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  "2036": [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  "2037": [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  "2038": [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  "2039": [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  "2040": [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  "2041": [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  "2042": [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  "2043": [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  "2044": [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  "2045": [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  "2046": [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  "2047": [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  "2048": [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  "2049": [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  "2050": [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  "2051": [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  "2052": [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  "2053": [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  "2054": [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  "2055": [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  "2056": [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
  "2057": [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  "2058": [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  "2059": [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  "2060": [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  "2061": [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  "2062": [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  "2063": [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  "2064": [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  "2065": [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  "2066": [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  "2067": [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  "2068": [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  "2069": [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  "2070": [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  "2071": [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  "2072": [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  "2073": [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  "2074": [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  "2075": [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  "2076": [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  "2077": [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  "2078": [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  "2079": [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  "2080": [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  "2081": [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  "2082": [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  "2083": [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  "2084": [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  "2085": [31, 32, 31, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  "2086": [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  "2087": [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 30, 30],
  "2088": [30, 31, 32, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  "2089": [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  "2090": [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  "2091": [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 30, 30],
  "2092": [30, 31, 32, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  "2093": [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  "2094": [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  "2095": [31, 31, 32, 31, 31, 31, 30, 29, 30, 30, 30, 30],
  "2096": [30, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  "2097": [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  "2098": [31, 31, 32, 31, 31, 31, 29, 30, 29, 30, 29, 31],
  "2099": [31, 31, 32, 31, 31, 31, 30, 29, 29, 30, 30, 30],
};

export const formattedDate = (year: number, month: number, day: number) => {
  return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
};

export const adToBs = (adDate: string) => {
  const startDate = new Date(START_ENGLISH_DATE);
  const today = new Date(adDate);
  const daysDifference = Math.floor(
    (today.getTime() - startDate.getTime()) / 86400000,
  );
  if (daysDifference < 0) {
    throw new Error("Date Out of Range");
  }
  // console.log(daysDifference, 'daysdiff');

  return evaluateNepaliDate(daysDifference);
};

export const bsToAd = (selectedDate: string) => {
  const [year, month, day] = selectedDate.split("-").map(Number);

  let daysDiff = 0;
  for (let i = MIN_YEAR_BS; i <= year; i++) {
    if (i === year) {
      for (let j = 1; j < month; j++) {
        daysDiff += nepaliMonthData[i][j - 1];
      }
      daysDiff += day - 1;
    } else {
      for (let j = 1; j <= 12; j++) {
        daysDiff += nepaliMonthData[i][j - 1];
      }
    }
  }
  return evaluateEnglishDate(START_ENGLISH_DATE, daysDiff);
};

export const toStringMonthDate = (
  date: number | string | null | undefined,
): string => {
  // Handle null/undefined
  if (date == null) return "";

  // Convert to string and validate format
  const strDate =
    typeof date === "number"
      ? fromDateInt(date).replace("-00-", "-01-") // Force "00" → "01"
      : date;

  // Extract components
  const [year, monthInNum, day] = strDate.split("-");
  const monthNum = Number(monthInNum);

  // Validate month (1-12)
  if (monthNum < 1 || monthNum > 12 || isNaN(monthNum)) {
    console.error("Invalid month (must be 01-12):", monthInNum);
    return "Invalid date";
  }

  // Return formatted date (e.g., "13 Baisakh 2081")
  return `${Number(day)} ${nepaliMonthsInEnglish[monthNum - 1]} ${year}`;
};

export const nextMonthBsDate = (currentDate: string) => {
  const [strYear, strMonth, strDay] = currentDate.split("-");
  const year = parseInt(strYear);
  const month = parseInt(strMonth);
  if (month < 12) {
    const nextYear = year;
    const nextMonth = month + 1;
    const nextDay = 1;
    return formattedDate(nextYear, nextMonth, nextDay);
  } else {
    const nextYear = year + 1;
    const nextMonth = 1;
    const nextDay = 1;
    return formattedDate(nextYear, nextMonth, nextDay);
  }
};

export const prevMonthBsDate = (currentDate: string) => {
  const [strYear, strMonth, strDay] = currentDate.split("-");
  const year = parseInt(strYear);
  const month = parseInt(strMonth);
  if (month > 1) {
    const prevYear = year;
    const prevMonth = month - 1;
    const prevDay = 1;
    return formattedDate(prevYear, prevMonth, prevDay);
  } else {
    const prevYear = year - 1;
    const prevMonth = 12;
    const prevDay = 1;
    return formattedDate(prevYear, prevMonth, prevDay);
  }
};

export const isValidNepaliDate = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;

  const [year, month, day] = date.split("-").map(Number);
  return (
    year >= MIN_YEAR_BS &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= getDaysInNepaliMonth(year, month)
  );
};

const evaluateEnglishDate = (date: string, days: number): string => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  const year = result.getFullYear();
  const month = result.getMonth() + 1;
  const day = result.getDate();
  return formattedDate(year, month, day);
};

const evaluateNepaliDate = (daysElpased: number, format = true): string => {
  let currentYear = 0;
  let currentMonth = 0;
  let currentDay = 0;
  let totalD = 0;
  let flag = false;
  for (let i = MIN_YEAR_BS; i <= MAX_YEAR_BS; i++) {
    if (flag) {
      break;
    }
    for (let j = 1; j <= 12; j++) {
      totalD += nepaliMonthData[i][j - 1];
      if (daysElpased - totalD < 0) {
        currentDay = daysElpased - totalD + nepaliMonthData[i][j - 1] + 1;
        flag = true;
        currentYear = i;
        currentMonth = j;
        break;
      }
    }
  }

  return formattedDate(currentYear, currentMonth, currentDay);
};

export const getCurrentBS = () => {
  const today = new Date();
  const formattedToday = formattedDate(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate(),
  );
  // console.log(formattedToday);

  return adToBs(formattedToday);
};

export function getDaysInNepaliMonth(year: number, month: number): number {
  if (nepaliMonthData[year] && month >= 1 && month <= 12) {
    return nepaliMonthData[year][month - 1];
  }
  return 30; // Default fallback
}

export const toDateInt = (date: string) => {
  return parseInt(date.replace(/-/g, ""));
};

export const fromDateInt = (date: number) => {
  // console.log(date,'date');

  const year = Math.floor(date / 10000);
  const month = Math.floor((date % 10000) / 100);
  const day = date % 100;
  return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
};
export const currentMonthStartDate = (currentDate: string) => {
  // const currentDate = getCurrentBS();
  if (!currentDate) {
    currentDate = getCurrentBS();
  }
  let date = currentDate.split("-").splice(0, 2);
  date = [...date, "01"];
  return date.join("-");
};

export const currentMonthEndDate = (currentDate: string) => {
  // const currentDate = getCurrentBS();
  if (!currentDate) {
    currentDate = getCurrentBS();
  }
  const [year, month] = currentDate.split("-").splice(0, 2);
  const date = [
    toDateInt(year),
    toDateInt(month),
    getDaysInNepaliMonth(toDateInt(year), toDateInt(month)),
  ];
  return date.join("-");
};
export const twoDateDiff = (
  firstDate: string | number,
  secondDate: string | number,
): number => {
  if (typeof firstDate == "number") {
    firstDate = fromDateInt(firstDate);
  }
  if (typeof secondDate == "number") {
    secondDate = fromDateInt(secondDate);
  }
  const firstDateInAD = bsToAd(firstDate);
  const secondDateInAD = bsToAd(secondDate);

  const date1 = new Date(firstDateInAD);
  const date2 = new Date(secondDateInAD);

  if (date2 < date1) {
    console.log("Invalid second date");
    return -1;
  }

  const diffInMs = date2.getTime() - date1.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  return diffInDays;
};

export const workingDays = (
  firstDate: string | number,
  secondDate: string | number,
): number => {
  if (typeof firstDate == "number") {
    firstDate = fromDateInt(firstDate);
  }
  if (typeof secondDate == "number") {
    secondDate = fromDateInt(secondDate);
  }
  const firstDateInAD = bsToAd(firstDate);
  const secondDateInAD = bsToAd(secondDate);

  let date1 = new Date(firstDateInAD);
  let date2 = new Date(secondDateInAD);

  if (date2 < date1) {
    console.log("Invalid second date");
    return -1;
  }

  let workingDays = 0;

  while (date1 <= date2) {
    const day = date1.getDay(); // 0 (Sunday) to 6 (Saturday)
    if (day !== 6) {
      // Exclude only Saturday
      workingDays++;
    }
    date1.setDate(date1.getDate() + 1);
  }

  return workingDays;
};

export const getCurrentInfo = (type: "year" | "month" | "day"): number => {
  const date = getCurrentBS();
  const [year, month, day] = date.split("-");
  if (type === "year") return parseInt(year);
  if (type === "month") return parseInt(month);
  if (type === "day") return parseInt(day);
  console.log(`year: ${year}, month: ${month}, day: ${day}`);
  console.error("Invalid argument.");
  return -1;
};
export const fromTimeInt = (time: number) => {
  const hours = Math.floor(time / 100);
  const minutes = time % 100;
  
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;

  return `${hours12.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")} ${period}`;
};

export const getRange = (
  type: "year" | "month" | "week",
  year: number,
  month: number | null = null,
  week: number | null = null,
): any => {
  let range: number[] = [];
  if (type === "year") {
    range[0] = year * 10000 + 100 + 1;
    range[1] = year * 10000 + 1200 + getDaysInNepaliMonth(year, 12);
  } else if (type === "month") {
    if (month == null) {
      throw new Error("Month is not provided");
    }
    range[0] = year * 10000 + month * 100 + 1;
    range[1] = year * 10000 + month * 100 + getDaysInNepaliMonth(year, month);
  } else if (type === "week") {
    if (week == null || month == null) {
      throw new Error("Month or Week is not provided");
    }
    let date = new Date();
    let currentBS = adToBs(date.toISOString().split("T")[0]);
    let [currentYear, currentMonth, currentDay] = currentBS
      .split("-")
      .map(Number);
    let currentWeek =
      Math.floor(
        (currentDay + getDaysInNepaliMonth(currentYear, currentMonth - 1) - 1) /
          7,
      ) + 1;
    let startDay = 1 + (week - 1) * 7;
    let endDay = week * 7;
    if (startDay > getDaysInNepaliMonth(year, month)) {
      startDay = 1;
    }
    if (endDay > getDaysInNepaliMonth(year, month)) {
      endDay = getDaysInNepaliMonth(year, month);
    }
    range[0] = year * 10000 + month * 100 + startDay;
    range[1] = year * 10000 + month * 100 + endDay;
  }
  return {
    start_date: range[0],
    end_date: range[1],
  };
};

export const formatTime = (time: number): string => {
  const str = time.toString().padStart(4, "0");
  const hours24 = parseInt(str.slice(0, 2), 10);
  const minutes = str.slice(2, 4);

  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

  return `${hours12}:${minutes} ${period}`;
};

export const getDay = (date: number) => {
  const str = date.toString();
  const day = str.slice(-1);

  return Number(day);
};

export const nepaliMonths = [
  "वैशाख",
  "जेठ",
  "असार",
  "श्रावण",
  "भदौ",
  "असोज",
  "कार्तिक",
  "मंसिर",
  "पुष",
  "माघ",
  "फाल्गुन",
  "चैत्र",
];

export const nepaliMonthsEng = [
  "Baisakh",
  "Jestha",
  "Asar",
  "Shrawan",
  "Bhadra",
  "Ashoj",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
];

export const nepaliDaysOfWeek = [
  "आइत",
  "सोम",
  "मंगल",
  "बुध",
  "बिहि",
  "शुक्र",
  "शनि",
];
export const nepaliMonthsInEnglish = [
  "Baisakh",
  "Jestha",
  "Ashar",
  "Shrawan",
  "Bhadra",
  "Ashoj",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
];

export const daysOfWeekInEnglish = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const nepaliMonthsWithValue = [
  { name: "Baisakh", value: 1 },
  { name: "Jestha", value: 2 },
  { name: "Ashadh", value: 3 },
  { name: "Shrawan", value: 4 },
  { name: "Bhadra", value: 5 },
  { name: "Ashwin", value: 6 },
  { name: "Kartik", value: 7 },
  { name: "Mangsir", value: 8 },
  { name: "Poush", value: 9 },
  { name: "Magh", value: 10 },
  { name: "Falgun", value: 11 },
  { name: "Chaitra", value: 12 },
];

export const isValidBsDate = (year: number, month: number, day: number): boolean => {
  return (
    year >= MIN_YEAR_BS &&
    year <= MAX_YEAR_BS &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= getDaysInNepaliMonth(year, month)
  );
};

export const getDatesForMonth = (year: number, month: number): number[] => {
  if (year < MIN_YEAR_BS || year > MAX_YEAR_BS || month < 1 || month > 12) {
    return [];
  }

  const totalDays = getDaysInNepaliMonth(year, month);
  return Array.from({ length: totalDays }, (_, index) => (year * 10000) + (month * 100) + index + 1);
};

