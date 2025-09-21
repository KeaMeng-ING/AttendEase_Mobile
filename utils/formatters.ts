// From ISO DateTime String "2025-09-21 12:17:34" to "12:17 PM"
export const formatTime = (dateTimeString: string): string => {
  const date = new Date(dateTimeString);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// From "3:00AM" to "03:00 AM"
export const formatPadTime = (date: Date): string => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const isPM = hours >= 12;

  // Convert to 12-hour format
  hours = hours % 12 || 12;

  // Pad hours and minutes
  const hourStr = hours.toString().padStart(2, "0");
  const minuteStr = minutes.toString().padStart(2, "0");

  return `${hourStr}:${minuteStr} ${isPM ? "PM" : "AM"}`;
};

// From Date Object to "Saturday, September 21, 2024"
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

console.log();
