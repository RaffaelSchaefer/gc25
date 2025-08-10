import { listUsers } from "@/app/(server)/users.actions";
import { UsersTable } from "../users-table";

export const dynamic = "force-dynamic"; // always fresh

export default async function AdminUsersPage() {
  const users = await listUsers();
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Verwalte alle registrierten Nutzer. Löschen ist endgültig.
        </p>
      </div>
      <UsersTable data={users} />
    </div>
  );
}
