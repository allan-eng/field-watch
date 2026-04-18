# CropTrack — Crop Progress Tracker

A simple web app to track crop progress across multiple fields during a growing season.

## Stack
- **Frontend**: React + Vite + TypeScript + Tailwind (custom agri-tech design system)
- **Backend / DB / Auth**: Lovable Cloud (Supabase under the hood — Postgres, RLS, Auth)
- **Validation**: zod (client-side) + RLS policies (server-side)

## Roles
Two roles, stored in a dedicated `user_roles` table (separate from `profiles` to prevent privilege escalation):
- **Admin / Coordinator** — sees all fields, creates/assigns fields, can post updates.
- **Field Agent** — sees and updates only fields assigned to them.

A user picks their role on the signup form (demo-friendly). The role is read from `raw_user_meta_data` by a trigger and inserted into `user_roles`. A SQL `has_role()` SECURITY DEFINER function is used by RLS policies to avoid recursive checks.

## Data model
- `profiles (id ↔ auth.users, full_name, email, …)`
- `user_roles (user_id, role: 'admin' | 'agent')`
- `fields (id, name, crop_type, planting_date, current_stage, size_hectares, location, assigned_agent_id, created_by, last_update_at)`
- `field_updates (id, field_id, author_id, stage, note, created_at)`

A trigger on `field_updates` syncs the parent field's `current_stage` and `last_update_at` automatically — agents post one record, the field state stays in sync.

## Field stages
`planted → growing → ready → harvested`

## Field status logic (computed, not stored)
Status is derived in `src/lib/status.ts`:

| Status | Rule |
| --- | --- |
| **Completed** | `current_stage === 'harvested'` |
| **At Risk** | not completed AND (no update in ≥ 7 days **OR** stage overdue vs planting date: planted >30d, growing >90d, ready >120d) |
| **Active** | otherwise |

This gives a sensible, configurable signal without crop-specific calendars. Thresholds live in one place.

## RLS summary
- `fields` SELECT: admins see all; agents see only `assigned_agent_id = auth.uid()`.
- `fields` INSERT/UPDATE/DELETE: admins only.
- `field_updates` INSERT: admin OR assigned agent of the parent field; `author_id` must equal `auth.uid()`.
- `field_updates` SELECT: admin OR assigned agent of the parent field.
- `user_roles` SELECT: own roles or admin; writes: admins only.

## Dashboard
- **Admin**: total fields, status breakdown (Active / At Risk / Completed), recent activity across all fields.
- **Agent**: same summary, scoped to their assigned fields by RLS.

## Try it
1. Sign up as a **Coordinator**.
2. Sign up a second account as a **Field Agent** (other browser / incognito).
3. As coordinator, create a field and assign it to the agent.
4. As agent, open the field and post a stage update + note.
5. Watch status chips update on both dashboards.
