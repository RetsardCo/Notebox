# 05 — Tag Management Implementation & Data Integrity

## 1. Overview & Requirements

Full CRUD capabilities for tags:
1. **Create Tag**: Case-insensitive unique name validation, hex color assignment, immediate sidebar rendering.
2. **Rename Tag**: Modifies `tags.name` while preserving foreign-key associations in `note_tags`.
3. **Change Tag Color**: Updates `tags.color` and propagates to all sidebar chips and note card chips.
4. **Delete Tag**: Removes the tag from `tags` and associated entries from `note_tags` without deleting or modifying any note documents.
5. **Filter Synchronization**: If the currently selected tag is deleted, active filter state smoothly resets to `All Notes`.

---

## 2. Backend Implementation (Rust + SQLite)

### 2.1 Schema & Foreign Key Constraints
In `src-tauri/src/db/mod.rs`:
```sql
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS note_tags (
    note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (note_id, tag_id)
);
```

Because `note_tags` links notes to tags via UUID `id` (not `name`), updating the tag's name or color preserves every existing association automatically.

### 2.2 `update_tag` Command Implementation
In `src-tauri/src/commands/tags.rs`:
```rust
#[tauri::command]
pub async fn update_tag(
    state: State<'_, AppState>,
    id: String,
    name: Option<String>,
    color: Option<String>,
) -> Result<Tag, String> {
    let pool = &state.db;

    // Verify tag exists
    let existing = sqlx::query_as::<_, Tag>("SELECT id, name, color, 0 as note_count FROM tags WHERE id = ?")
        .bind(&id)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Tag with id '{}' not found", id))?;

    let final_name = match name {
        Some(n) => {
            let trimmed = n.trim();
            if trimmed.is_empty() {
                return Err("Tag name cannot be empty".to_string());
            }
            // Check for case-insensitive duplicate excluding self
            let duplicate = sqlx::query_scalar::<_, i64>(
                "SELECT COUNT(*) FROM tags WHERE LOWER(name) = LOWER(?) AND id != ?"
            )
            .bind(trimmed)
            .bind(&id)
            .fetch_one(pool)
            .await
            .map_err(|e| e.to_string())?;

            if duplicate > 0 {
                return Err(format!("A tag named '{}' already exists", trimmed));
            }
            trimmed.to_string()
        }
        None => existing.name,
    };

    let final_color = match color {
        Some(c) => Some(c.trim().to_string()),
        None => existing.color,
    };

    sqlx::query("UPDATE tags SET name = ?, color = ? WHERE id = ?")
        .bind(&final_name)
        .bind(&final_color)
        .bind(&id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    let count = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM note_tags WHERE tag_id = ?")
        .bind(&id)
        .fetch_one(pool)
        .await
        .unwrap_or(0);

    Ok(Tag {
        id,
        name: final_name,
        color: final_color,
        note_count: count,
    })
}
```

Registered in `src-tauri/src/lib.rs` invoke handler:
```rust
.invoke_handler(tauri::generate_handler![
    ...
    commands::tags::update_tag,
    ...
])
```

---

## 3. Frontend Store & IPC Integration

### 3.1 IPC Service (`src/lib/services/ipc.ts`)
```typescript
export const tagService = {
  getTags: async (): Promise<Tag[]> => {
    return safeInvoke('get_tags', undefined, mockTags);
  },
  createTag: async (name: string, color?: string): Promise<Tag> => {
    ...
    return safeInvoke('create_tag', { name, color: color ?? null }, ...);
  },
  updateTag: async (id: string, name?: string, color?: string): Promise<Tag> => {
    ...
    return safeInvoke('update_tag', { id, name: name ?? null, color: color ?? null }, ...);
  },
  deleteTag: async (id: string): Promise<void> => {
    ...
    return safeInvoke('delete_tag', { id });
  },
};
```

### 3.2 State Management (`src/lib/stores/appState.svelte.ts`)
```typescript
async updateTag(id: string, name?: string, color?: string) {
  const currentTag = this.tags.find(t => t.id === id);
  const oldName = currentTag?.name;
  await tagService.updateTag(id, name, color);
  if (oldName && this.selectedTag === oldName && name) {
    this.selectedTag = name;
  }
  await this.loadTags();
  await this.loadNotes();
}

async deleteTag(id: string) {
  const tagToDelete = this.tags.find(t => t.id === id);
  await tagService.deleteTag(id);
  if (tagToDelete && this.selectedTag === tagToDelete.name) {
    this.selectedTag = null;
    this.selectedSmartFolder = 'all';
  }
  await this.loadTags();
  await this.loadNotes();
}
```

---

## 4. UI/UX Interface (`Sidebar.svelte`)

- **Ellipsis Overflow Trigger**: Every tag row renders a subtle `...` button (`MoreHorizontal`) visible on row hover and keyboard focus.
- **Action Dropdown**: Provides "Edit tag" and "Delete tag" actions.
- **Edit Tag Dialog**:
  - Centered modal dialog with backdrop blur.
  - Tag Name text input with auto-focus.
  - 8-color swatch palette selector with active checkmark ring.
  - Form validation: non-empty name, error messaging on duplicates.
- **Delete Tag Confirmation**:
  - Modal confirmation ensuring accidental deletion is avoided.
  - Clear notice that notes tagged with this tag remain intact.

---

## 5. Verification Record

1. **Automated Rust Backend Test (`src-tauri/tests/backend_tests.rs::test_tag_crud_and_safety`)**:
   - Creates a note and associates tag `alpha`.
   - Renames tag to `alpha_v2` and verifies the association persists.
   - Recolors tag to `#10b981` and verifies color update.
   - Attempts renaming to an existing tag and asserts duplicate rejection error.
   - Deletes tag and asserts `tags` row and `note_tags` associations are deleted, while the underlying note in `notes` remains intact.
   - **Result**: PASSED (`test tests::test_tag_crud_and_safety ... ok`).
2. **Visual Proof**:
   - `docs/uiux/screenshots/after/after_tag_selected_1366x768.png` (selected state with `#work`).
   - `docs/uiux/screenshots/after/after_tag_edit_dialog_1366x768.png` (Edit Tag modal with swatch selection).
