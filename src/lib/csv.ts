export type CsvCell = string | number | boolean | null | undefined

export function toCsv(headers: string[], rows: CsvCell[][]) {
  const all: CsvCell[][] = [headers, ...rows]
  const body = all
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\r\n")
  return `\uFEFF${body}`
}

export function csvResponse(filename: string, headers: string[], rows: CsvCell[][]) {
  return new Response(toCsv(headers, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}

export function isoDate(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString() : ""
}
