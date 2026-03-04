export const formatPeriodDuration = (seconds) => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  let result = "";
  if (d) result += d + "d";
  if (h) result += h + "h";
  if (m) result += m + "m";
  if (s) result += s + "s";
  return result || "0s";
};
