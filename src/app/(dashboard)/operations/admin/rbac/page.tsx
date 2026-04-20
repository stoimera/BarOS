import Link from "next/link"
import { OPERATIONS_PERMISSION_MATRIX, listPermissionsForRole } from "@/lib/security/permissions"
import { StaffLocationAssignment } from "@/components/operations/StaffLocationAssignment"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

function permissionLabel(permission: string) {
  return OPERATIONS_PERMISSION_MATRIX.find((r) => r.permission === permission)?.description ?? permission
}

export default function OperationsAdminRbacPage() {
  const adminPerms = listPermissionsForRole("admin")
  const staffPerms = listPermissionsForRole("staff")

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Who can do what</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Admin only — what staff and managers are allowed to touch, and which site they work at.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/operations">Back to Administrative Operations</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permission catalog</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {OPERATIONS_PERMISSION_MATRIX.map((row) => (
              <li key={row.permission} className="border-b border-border pb-2 text-muted-foreground">
                {row.description}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admin role</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc text-sm text-muted-foreground">
              {adminPerms.map((p) => (
                <li key={p}>{permissionLabel(p)}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Staff role</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc text-sm text-muted-foreground">
              {staffPerms.map((p) => (
                <li key={p}>{permissionLabel(p)}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <StaffLocationAssignment />

      <p className="text-xs text-muted-foreground">Your technical contact keeps the written access policy on file.</p>
    </div>
  )
}
