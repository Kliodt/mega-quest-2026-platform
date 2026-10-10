/**
 * Разбор CSV по RFC 4180: значения в кавычках могут содержать запятые, переводы строк
 * и удвоенные кавычки. Первая строка — заголовок, дальше по строке на запись.
 */
export function parseCsv(text: string): Record<string, string>[] {
  const rows = toRows(text);
  const [header, ...body] = rows;
  if (!header) {
    return [];
  }
  return body
    .filter((cells) => cells.some((cell) => cell !== ''))
    .map((cells) => Object.fromEntries(header.map((name, index) => [name, cells[index] ?? ''])));
}

function toRows(text: string): string[][] {
  const rows: string[][] = [];
  let cells: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char !== '"') {
        value += char;
      } else if (text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = false;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      cells.push(value);
      value = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') {
        index += 1;
      }
      cells.push(value);
      rows.push(cells);
      cells = [];
      value = '';
    } else {
      value += char;
    }
  }

  if (value !== '' || cells.length > 0) {
    cells.push(value);
    rows.push(cells);
  }
  return rows;
}
