# Account settings: the third shell

There are now three shells, not two:

| Shell | Route group | About | Branding provider |
|---|---|---|---|
| Organization dashboard | `(dashboard)` | the organization you are working in | `BrandingProvider` |
| Personal space | `(personal)` | your own subscriptions | `PersonalBrandingProvider` |
| **Account settings** | **`(account)`** | **you** | **`AccountBrandingProvider`** |

All three are the same `Sidebar`, `DashboardHeader` and scroll container, fed a
different `SidebarCatalog`. Adding one is a catalog and a layout, not a fork of
the components — which is what `shared/config/sidebar-catalog.tsx` was built
for.

## Why it is a shell and not a page

Every setting under `/account` belongs to the **person**, not to the
organization or the console they happen to be in. The same user reaches these
pages from an organization dashboard and from their personal space, and gets
the same five sections either way.

Putting them inside `(personal)` would have tied "my profile" to a space an
organization user may never open; putting them inside `(dashboard)` would have
made them unreachable without an organization.

## The sections

| Route | What it is |
|---|---|
| `/account/profile` | name and phone number |
| `/account/email` | change the sign-in address, with a code |
| `/account/sessions` | devices this account is signed in from |
| `/account/appearance` | colour and theme |
| `/account/billing` | DIAN electronic-invoicing profile |

### There is no "change password"

Sign-in is a code emailed to your address. There is no password anywhere in
the product — no `passwordHash` on `User`, no endpoint. **The address is the
credential**, so `/account/email` is the credential-change screen.

The code goes to the **new** address, which is what proves the person controls
the mailbox they are moving to. Confirming ends every session, this one
included, because the address is inside the signed token; the page signs the
browser out deliberately rather than letting the next request 401 into the
splash.

### Appearance moved here from the personal space

`primaryColor` and `defaultTheme` live on `UserPreferences`, so they follow a
person into every space they open — they were never a property of the personal
space. `/personal/appearance` is kept as a redirect, because that path is in
people's history and in the favourites some of them saved.

What stayed in `/personal/settings` is what is genuinely about tracking
subscriptions: timezone, currency and renewal reminders.

### Billing moved here from the console

The DIAN profile — RUT, tax regime, resolution, numbering range — was only
reachable at `/admin/user-info/[userId]`, so the data an account holder is the
only person who actually knows had to be typed in by a global administrator.

The editor itself is shared. `features/user-info/components/billing-profile-editor.tsx`
is ~700 lines of fiscal form extracted from that admin page; both call sites
render it and differ only in whose profile they load and where the mutations
point. A second copy would be a second place to forget a DIAN field, and both
write to the same two tables.

The console keeps its view: support needs to be able to look.

## `AccountBrandingProvider` redirects nobody

That is the entire reason it exists rather than reusing one of the other two:

- `BrandingProvider` bounces a user with no organization to `/onboarding`.
  A personal-space user legitimately has none.
- `PersonalBrandingProvider` bounces anyone whose *personal* onboarding is
  unfinished, also to `/onboarding`. An organization user has usually never
  started that wizard, so opening their own profile would throw them into a
  setup they never asked for.

## Reachability

`/account/*` is not public and not `/admin/*`, so the edge middleware already
requires a **tenant** session and redirects to `/auth` otherwise. No matcher
change was needed.

That is also why the user menu only offers these links when
`environment === 'dashboard'`: the BFF sends tenant cookies, so an
administrator holding only a console session would follow the link straight
out of the console. The console does not offer it.
