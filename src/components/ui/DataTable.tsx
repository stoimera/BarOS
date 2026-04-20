import React from "react";

export type DataTableColumn<T> = {
  header: string;
  accessor: keyof T | string;
  cell?: (row: T) => React.ReactNode;
};

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  className?: string;
}

export function DataTable<T extends { id?: string | number }>(
  { columns, data, loading, className }: DataTableProps<T>
) {
  return (
    <div className={`overflow-x-auto rounded border ${className || ''}`}>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-muted text-foreground">
            {columns.map(col => (
              <th key={col.header} className="px-4 py-2 text-left font-semibold">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length} className="text-center py-8">Loading...</td></tr>
          ) : data.length === 0 ? (
            <tr><td colSpan={columns.length} className="text-center py-8 text-muted-foreground">No data</td></tr>
          ) : (
            data.map((row, i) => (
              <tr key={row.id ?? i} className="border-t hover:bg-muted/50">
                {columns.map(col => (
                  <td key={col.header} className="px-4 py-2 align-top">
                    {col.cell ? col.cell(row) : (row[col.accessor as keyof T] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
} 