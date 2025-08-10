"use client";
import { ColumnDef, Column, Row } from "@tanstack/react-table";
import { AdminUserDto } from "@/app/(server)/users.actions";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Trash2 } from "lucide-react";

export const userColumns = (
  onDelete: (id: string) => void,
): ColumnDef<AdminUserDto>[] => [
  {
    accessorKey: "name",
    header: ({ column }: { column: Column<AdminUserDto, unknown> }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }: { column: Column<AdminUserDto, unknown> }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Email <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "isAdmin",
    header: "Admin",
    cell: ({ row }: { row: Row<AdminUserDto> }) => (
      <span
        className={
          row.original.isAdmin ? "text-green-600" : "text-muted-foreground"
        }
      >
        {row.original.isAdmin ? "Yes" : "No"}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }: { column: Column<AdminUserDto, unknown> }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Created <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }: { row: Row<AdminUserDto> }) =>
      new Date(row.original.createdAt).toLocaleString(),
  },
  {
    accessorKey: "lastSessionAt",
    header: "Last Session",
    cell: ({ row }: { row: Row<AdminUserDto> }) =>
      row.original.lastSessionAt
        ? new Date(row.original.lastSessionAt).toLocaleString()
        : "–",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }: { row: Row<AdminUserDto> }) => {
      const isAdmin = row.original.isAdmin;
      return (
        <Button
          variant="destructive"
          size="icon"
          onClick={() => !isAdmin && onDelete(row.original.id)}
          title={isAdmin ? "Admin accounts cannot be deleted" : "Delete user"}
          disabled={isAdmin}
          className={isAdmin ? "opacity-40 cursor-not-allowed" : undefined}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      );
    },
  },
];
