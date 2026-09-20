// ─────────────────────────────────────────────────────────────────────────────
// app/(account)/account/page.tsx
//
// /account is the panel, not a page. Anyone landing on it — a bookmark, a
// stale link, the sidebar's own root — goes to the first section.
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation';

export default function AccountIndexPage() {
  redirect('/account/profile');
}
