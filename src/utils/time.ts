export function getCurrentIssueTimeUTC(): string {
  const now = new Date();
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hour = String(now.getUTCHours()).padStart(2, "0");
  const minute = String(now.getUTCMinutes()).padStart(2, "0");
  return `${day}${hour}${minute}`;
}

export function getBaseForecastPeriod(issueTime: string): { from: string; to: string } {
  const day = Number(issueTime.slice(0, 2));
  const hour = Number(issueTime.slice(2, 4));
  const nextHour = (hour + 1) % 24;
  const fromDay = hour === 23 ? day + 1 : day;
  const toDay = fromDay + 1;

  return {
    from: `${String(fromDay).padStart(2, "0")}${String(nextHour).padStart(2, "0")}`,
    to: `${String(toDay).padStart(2, "0")}${String(nextHour).padStart(2, "0")}`,
  };
}

export function getTimelineStartHour(issueTime: string): number {
  const hour = Number(issueTime.slice(2, 4));
  const minute = Number(issueTime.slice(4, 6));
  if (Number.isNaN(hour) || Number.isNaN(minute)) return 0;
  return (hour + (minute > 0 ? 1 : 0)) % 24;
}
