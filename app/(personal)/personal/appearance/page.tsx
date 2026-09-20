// ─────────────────────────────────────────────────────────────────────────────
// app/(personal)/personal/appearance/page.tsx
//
// Moved to /account/appearance. The colour and theme live on UserPreferences,
// so they follow the person into every space they open — they were never a
// property of the personal space, and the same settings screen now serves an
// organization user too.
//
// Kept as a redirect rather than deleted: this path is in people's history and
// in the sidebar favourites some of them saved.
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation';

export default function PersonalAppearanceRedirect() {
  redirect('/account/appearance');
}
