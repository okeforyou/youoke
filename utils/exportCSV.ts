/**
 * Export data to CSV file
 * Utility function for exporting arrays of objects to CSV format
 */

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  // Get all unique keys from all objects
  const allKeys = Array.from(
    new Set(data.flatMap((obj) => Object.keys(obj)))
  );

  // Create CSV header
  const header = allKeys.join(",");

  // Create CSV rows
  const rows = data.map((obj) =>
    allKeys
      .map((key) => {
        let value = obj[key];

        // Handle different data types
        if (value === null || value === undefined) {
          return "";
        }

        // Handle Firestore Timestamps
        if (value?.toDate && typeof value.toDate === "function") {
          value = value.toDate().toISOString();
        }

        // Handle objects (stringify them)
        if (typeof value === "object") {
          value = JSON.stringify(value);
        }

        // Handle strings with commas or quotes
        const stringValue = String(value);
        if (stringValue.includes(",") || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
      })
      .join(",")
  );

  // Combine header and rows
  const csv = [header, ...rows].join("\n");

  // Create blob and download
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${Date.now()}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Convert complex objects to flat structure for CSV export
 */
export function flattenForCSV(obj: any, prefix = ""): any {
  const flattened: any = {};

  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;

    const value = obj[key];
    const newKey = prefix ? `${prefix}_${key}` : key;

    if (value === null || value === undefined) {
      flattened[newKey] = "";
    } else if (value?.toDate && typeof value.toDate === "function") {
      // Firestore Timestamp
      flattened[newKey] = value.toDate().toISOString();
    } else if (typeof value === "object" && !Array.isArray(value)) {
      // Nested object - flatten it
      Object.assign(flattened, flattenForCSV(value, newKey));
    } else if (Array.isArray(value)) {
      // Array - join with semicolons
      flattened[newKey] = value.join("; ");
    } else {
      flattened[newKey] = value;
    }
  }

  return flattened;
}
