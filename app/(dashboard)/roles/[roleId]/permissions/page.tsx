"use client"

// ─────────────────────────────────────────────────────────────────────────────
// app/(dashboard)/roles/[roleId]/permissions/page.tsx
//
// Route page wrapper for the Role Permissions panel.
// Resolves Next.js 15+ / 16 dynamic route params via React.use() promise helper.
// ─────────────────────────────────────────────────────────────────────────────

import * as React from "react"
import { RolePermissionsPanel } from "@/features/permissions/components/role-permissions-panel"

interface RolePermissionsPageProps {
  params: Promise<{
    roleId: string
  }>
}

export default function RolePermissionsPage({ params }: RolePermissionsPageProps) {
  const resolvedParams = React.use(params)
  return <RolePermissionsPanel roleId={resolvedParams.roleId} />
}
