function isRecord(value) {
  return typeof value === "object" && value !== null;
}

export function numberRecord(value) {
  if (!isRecord(value)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry) => typeof entry[1] === "number" && Number.isFinite(entry[1]),
    ),
  );
}

export function stringRecord(value) {
  if (!isRecord(value)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value).filter((entry) => typeof entry[1] === "string"),
  );
}
