# Phase 3A database schema

Migration order:

1. `20261026000001_identity_schema.sql`: private helper schema, four tables, constraints, indexes, revision triggers, RLS and owner SELECT grants.
2. `20261026000002_identity_access.sql`: atomic bootstrap, owner mutation RPCs and restricted public projection role/functions. Both migrations are transactional.

| Table                | Identity and ownership                         | Important constraints/defaults                                                                                                                                         |
| -------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| profiles             | user_id UUID PK → auth.users ON DELETE CASCADE | nullable lowercase unique username; display_name <=80 Unicode code points; bio <=500; reserved avatar_path <=512; revision=1; server timestamps; deletion_requested_at |
| profile_privacy      | user_id PK → profiles CASCADE                  | private/false/false; public or private; private cannot be discoverable; show_activity=false; revision and updated_at                                                   |
| user_preferences     | user_id PK → profiles CASCADE                  | locale en/ru default en; theme system/light/dark default system; revision and updated_at                                                                               |
| playground_user_data | UUID id PK; user_id → profiles CASCADE         | unique(user_id,app_key,data_key); app_key=practice-timer; bounded ASCII data_key; version=1; object payload <=16 KiB encoded JSONB; timestamps/revision                |

The Playground version-one payload is deliberately `{}` until the Timer payload is implemented in its own approved change. This foundation provides create/update/delete ownership and versioning without inventing timer data. It does not store timer state or presets yet. Zod matches this restriction. JSON object and UTF-8 byte constraints remain explicit database defenses.

Profiles are unique by lower(username); lowercase syntax is also enforced. Nullable username supports safe bootstrap without collisions or Auth metadata copying. Empty display name is allowed for unpublished bootstrap, but publication requires a nonblank name; a published name cannot be cleared through RPC.

Indexes: profile PKs; partial case-insensitive username uniqueness; partial privacy discovery index; unique playground owner/app/data key; owner/app/updated_at/id ordering. No speculative JSON GIN indexes.

Owner RPCs: ensure_profile(), update_own_profile(p_patch,p_expected_revision), set_own_privacy(p_visibility,p_discoverable,p_expected_revision), set_own_preferences(p_locale,p_theme,p_expected_revision), put_own_playground_data(...), delete_own_playground_data(...). All derive owner from auth.uid(). Profile lock serializes writes and count checks (50 per app / 200 per user); optimistic revision rejects stale updates with SQLSTATE 40001. Creation uses null expected revision and rejects duplicate natural keys; deletion of absent own data is idempotent. Private transitions normalize discoverable=false.

Public RPCs: get_public_profile(p_user_id) and list_public_profiles(p_after,p_limit). Projection, grants and privacy are detailed in security-model.md. They return no auth data, timestamps, revision, lifecycle flags, privacy flags, preferences or avatar storage paths.

Database TypeScript types are generated from the verified local public schema. They are persistence types, not DTOs. `pnpm db:types` replaces them only after successful local CLI generation; it preserves the existing file on failure. Actual FK relationships, insert requirements and JSONB storage nullability replace the provisional definitions. The separate database.ts SDK type adjustment preserves nullable usernames in public RPC results: generator metadata for RETURNS TABLE loses this underlying column nullability. Raw generated output remains reproducible; Zod DTO validation stays independent.
