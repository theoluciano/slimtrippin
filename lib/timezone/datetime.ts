export type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string) {
  const cached = formatterCache.get(timeZone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  formatterCache.set(timeZone, formatter);
  return formatter;
}

export function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const values = Object.fromEntries(
    getFormatter(timeZone)
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  const hour = Number(values.hour) === 24 ? 0 : Number(values.hour);

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour,
    minute: Number(values.minute),
  };
}

export function utcIsoToDatetimeLocal(iso: string, timeZone: string) {
  const parts = getZonedParts(new Date(iso), timeZone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function datetimeLocalToUtcIso(value: string, timeZone: string) {
  const parts = parseDatetimeLocal(value);
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  );
  const firstOffset = getTimeZoneOffsetMs(new Date(localAsUtc), timeZone);
  let utcMs = localAsUtc - firstOffset;
  const secondOffset = getTimeZoneOffsetMs(new Date(utcMs), timeZone);

  if (firstOffset !== secondOffset) {
    utcMs = localAsUtc - secondOffset;
  }

  return new Date(utcMs).toISOString();
}

export function addHoursToDatetimeLocal(value: string, hours: number) {
  const parts = parseDatetimeLocal(value);
  const ms = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour + hours,
    parts.minute,
  );
  const date = new Date(ms);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

export function formatTripDate(date: string) {
  const utcNoon = new Date(`${date}T12:00:00.000Z`);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(utcNoon);
}

export function formatDateLabel(date: string, timeZone: string) {
  const utcNoon = new Date(`${date}T12:00:00.000Z`);
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(utcNoon);
}

export function formatTimeLabel(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function dateKeyForIso(iso: string, timeZone: string) {
  const parts = getZonedParts(new Date(iso), timeZone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function eachDate(startDate: string, endDate: string) {
  const dates: string[] = [];
  const current = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = getZonedParts(date, timeZone);
  const zonedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  );
  return zonedAsUtc - date.getTime();
}

function parseDatetimeLocal(value: string): ZonedParts {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
  );

  if (!match) {
    throw new Error(`Invalid datetime-local value: ${value}`);
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
