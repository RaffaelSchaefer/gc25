"use client";
import * as React from "react";
import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  HeaderGroup,
  Header,
  Row,
  Cell,
} from "@tanstack/react-table";
import { AdminUserDto, deleteUserAdmin } from "@/app/(server)/users.actions";
import { userColumns } from "./users-table-columns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export function UsersTable({ data }: { data: AdminUserDto[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filter, setFilter] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onDelete = useCallback(
    (id: string) => {
      if (!confirm("Delete this user? This cannot be undone.")) return;
      startTransition(async () => {
        try {
          await deleteUserAdmin(id);
          toast.success("User deleted");
          router.refresh();
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Failed to delete user";
          toast.error(msg);
        }
      });
    },
    [router],
  );

  const cols: ColumnDef<AdminUserDto>[] = React.useMemo(
    () => userColumns(onDelete),
    [onDelete],
  );
  const filtered = filter
    ? data.filter((d) =>
        [d.name, d.email].some((v) =>
          v.toLowerCase().includes(filter.toLowerCase()),
        ),
      )
    : data;
  const table = useReactTable({
    data: filtered,
    columns: cols,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Filter name or email..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
        {pending && (
          <span className="text-sm text-muted-foreground">Updating...</span>
        )}
        {filter && (
          <Button variant="outline" size="sm" onClick={() => setFilter("")}>
            Clear
          </Button>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg: HeaderGroup<AdminUserDto>) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header: Header<AdminUserDto, unknown>) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row: Row<AdminUserDto>) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row
                    .getVisibleCells()
                    .map((cell: Cell<AdminUserDto, unknown>) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={cols.length} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
