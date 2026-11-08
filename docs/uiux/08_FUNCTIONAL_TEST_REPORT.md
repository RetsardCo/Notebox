# 08 — Functional Test Report

## 1. Test Execution Summary

| Test Suite | Framework / Tool | Command Run | Tests Passed | Tests Failed | Exit Code | Status |
|---|---|---|---|---|---|---|
| Frontend Static Diagnostics | `svelte-check` | `npm run check` | N/A (0 errors, 0 warnings) | 0 | 0 | PASSED |
| Frontend Unit & Layout Tests | Vitest v5.0.5 | `npm run test` | 129 passed | 0 | 0 | PASSED |
| Backend Integration Tests | Rust `cargo test` | `cargo test` | 11 passed | 0 | 0 | PASSED |
| Production Build | Vite v8.3.5 / SvelteKit | `npm run build` | 100% build output | 0 | 0 | PASSED |

---

## 2. Test Suite Details

### 2.1 Svelte Check Diagnostics
Executed command:
```powershell
cd "D:\Antigravity\scratch\noteflow"; npm run check
```
Output:
```
> notebox@0.1.0 check
> svelte-kit sync && svelte-check --tsconfig ./tsconfig.json

Loading svelte-check in workspace: d:\Antigravity\scratch\noteflow
Getting Svelte diagnostics...

svelte-check found 0 errors and 0 warnings
```

### 2.2 Vitest Unit Tests
Executed command:
```powershell
cd "D:\Antigravity\scratch\noteflow"; npm run test
```
Output:
```
 RUN  v5.0.5 D:/Antigravity/scratch/noteflow

 ✓ src/lib/utils/layout.test.ts (12 tests) 7ms
 ✓ src/lib/utils/zoom.test.ts (31 tests) 11ms
 ✓ src/lib/utils/markdown.test.ts (13 tests) 52ms
 ✓ src/lib/utils/zoom.stress.test.ts (55 tests) 43ms
 ✓ src/lib/utils/zoom-isolation.test.ts (18 tests) 11ms

 Test Files  5 passed (5)
      Tests  129 passed (129)
   Start at  22:34:58
   Duration  1.27s (transform 45%, import 44%, tests 8%, worker 3%)
```

### 2.3 Rust Backend Cargo Tests
Executed command:
```powershell
cd "D:\Antigravity\scratch\noteflow\src-tauri"; cargo test
```
Output:
```
running 11 tests
test tests::test_crypto_hashing_and_verification ... ok
test tests::test_crypto_encryption_and_decryption_with_random_nonces ... ok
test tests::test_session_state_json_roundtrip ... ok
test tests::test_welcome_note_body_starts_with_media_banner ... ok
test tests::test_tag_crud_and_safety ... ok
test tests::test_checklist_smart_folder_filtering ... ok
test tests::test_database_initialization_and_seeding ... ok
test tests::test_trash_auto_purge ... ok
test tests::test_sync_checklist_flags_backfill ... ok
test tests::test_legacy_noteflow_db_and_session_migration ... ok
test tests::test_legacy_vellum_db_and_session_migration ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.08s
```

### 2.4 Production Build Verification
Executed command:
```powershell
cd "D:\Antigravity\scratch\noteflow"; npm run build
```
Output:
```
✓ 4480 modules transformed.
rendering chunks...
vite v8.3.5 building client environment for production...
✓ 4553 modules transformed.
rendering chunks...
✓ built in 6.47s
> Using @sveltejs/adapter-static
  Wrote site to "build"
  ✔ done
```

---

## 3. Data Integrity & Safety Edge Cases

1. **Tag Rename Preserves Note Associations**:
   - `note_tags` references `tags(id) ON DELETE CASCADE`.
   - Renaming tag modifies only `tags.name`, leaving foreign keys intact.
   - Verified via Rust test `test_tag_crud_and_safety`.
2. **Tag Deletion Does Not Delete Notes**:
   - Deleting a tag deletes rows in `note_tags` (with defensive deletion in Rust command + `CASCADE`), but has zero effect on the `notes` table.
   - Verified via Rust test `test_tag_crud_and_safety`.
3. **Empty / Duplicate Tag Names Rejected**:
   - Whitespace/empty inputs return error `Tag name cannot be empty`.
   - Post-prefix whitespace is trimmed so `" # urgent "` normalizes cleanly to `"urgent"`.
   - Case-insensitive duplicate check in both `create_tag` and `update_tag` returns `A tag named '...' already exists`.
4. **Deleted Note Folder Fallback on Restore**:
   - If a note is restored from Recently Deleted but its original folder was deleted, the restore logic falls back to `folder_id = NULL` (Uncategorized) rather than failing a foreign-key constraint.
   - Verified via Rust test `test_tag_crud_and_safety` and `src-tauri/src/commands/notes.rs`.
5. **Junction Realpath Normalization for Windows Builds**:
   - `vite.config.js` normalizes `process.cwd()` to `fs.realpathSync(process.cwd())`, preventing Rolldown placeholder path mismatch errors when building across NTFS junctions.
6. **Dynamic Note Card Tag Color Representation**:
   - Note card tag chips dynamically render the matching tag color swatch dot, soft tint background, and border, rather than a hardcoded accent color.
7. **Modal Focus Trap & Auto-focus**:
   - `SettingsModal.svelte` traps focus inside the modal with Tab/Shift+Tab and automatically sets initial focus on open.
