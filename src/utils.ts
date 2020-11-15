export function replaceAll(
  source: string,
  searchValue: any,
  replaceValue: string
) {
  const index = source.search(searchValue);
  if (index === -1) {
    return source;
  }
  return replaceAll(
    source.replace(searchValue, replaceValue),
    searchValue,
    replaceValue
  );
}

export function replaceAllGroup(source: string, args: [any, string][]) {
  if (args.length === 0) {
    return source;
  }
  const [searchValue, replaceValue] = args.shift();
  const nextSource = replaceAll(source, searchValue, replaceValue);
  return replaceAllGroup(nextSource, args);
}

export function convertType(type: string) {
  switch (type) {
    case "integer":
      return "number";
    default:
      return type;
  }
}
