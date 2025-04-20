import React, { useState, useMemo, ReactNode } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import dayjs from "dayjs";
import { bloomfield } from "./bloomfield";
type Store = {
  name: string;
  hours: Record<string, { open: string; close: string }>;
};

type SelectOption = {
  value: string;
  label: string;
};

const storeData: Store[] = bloomfield.stores;
const getCurrentTime = (): string => dayjs().format("HHmm");
const getCurrentDay = (): string => dayjs().format("dddd");

type CardProps = {
  children: ReactNode;
};

const Card: React.FC<CardProps> = ({ children }) => (
  <div className="border rounded-lg shadow-md p-4 bg-white">{children}</div>
);

type InputProps = {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
};

const Input: React.FC<InputProps> = ({ value, onChange, placeholder }) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="border p-2 rounded w-full"
  />
);

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
};

const Select: React.FC<SelectProps> = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="border p-2 rounded w-full"
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);
const parseTimeToJSDate = (time: string): Date => {
  const hours = parseInt(time.substring(0, 2), 10);
  const minutes = parseInt(time.substring(2, 4), 10);
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes
  );
};
const StoreTable: React.FC = () => {
  const [search, setSearch] = useState<string>("");
  const [dayFilter, setDayFilter] = useState<string>("Current Day");
  const [openFilter, setOpenFilter] = useState<string>("All");
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const filteredData = useMemo(() => {
    return storeData.filter((store) => {
      if (search && !store.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (openFilter === "Open Now") {
        const today = dayFilter === "Current Day" ? getCurrentDay() : dayFilter;
        const now = getCurrentTime();
        const { open, close } = store.hours[today] || {};
        const parsedOpen = parseTimeToJSDate(open);
        const parsedClose = parseTimeToJSDate(close);
        const parsedNow = parseTimeToJSDate(now);
        if (!(parsedNow >= parsedOpen && parsedNow <= parsedClose))
          return false;
      }
      return true;
    });
  }, [search, dayFilter, openFilter]);

  const columns: ColumnDef<Store>[] = [
    { accessorKey: "name", header: "Store Name" },
    {
      accessorKey: "hours",
      header: "Hours",
      cell: ({ row }) => {
        const today = dayFilter === "Current Day" ? getCurrentDay() : dayFilter;
        const { open, close } = row.original.hours[today] || {};
        return `${open} - ${close}`;
      },
      sortingFn: (a, b, c) => {
        const [aClosing, bClosing] = [a, b].map((row) => {
          const today =
            dayFilter === "Current Day" ? getCurrentDay() : dayFilter;
          const { close } = row.original.hours[today] || {};
          const parsedClose = parseTimeToJSDate(close);
          return parsedClose;
        });
        return aClosing.getTime() - bClosing.getTime();
      },
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(), //client-side sorting
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <Card>
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Search store..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          value={dayFilter}
          onChange={setDayFilter}
          options={[
            { value: "Current Day", label: "Current Day" },
            ...Object.keys(storeData[0].hours).map((day) => ({
              value: day,
              label: day,
            })),
          ]}
        />
        <Select
          value={openFilter}
          onChange={setOpenFilter}
          options={[
            { value: "All", label: "All Stores" },
            { value: "Open Now", label: "Open Now" },
          ]}
        />
      </div>
      <table className="w-full border-collapse border border-gray-200">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="border p-2"
                  onClick={header.column.getToggleSortingHandler()}
                  title={
                    header.column.getCanSort()
                      ? header.column.getNextSortingOrder() === "asc"
                        ? "Sort ascending"
                        : header.column.getNextSortingOrder() === "desc"
                        ? "Sort descending"
                        : "Clear sort"
                      : undefined
                  }
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {{
                    asc: " 🔼",
                    desc: " 🔽",
                  }[header.column.getIsSorted() as string] ?? null}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border p-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};

export default StoreTable;
