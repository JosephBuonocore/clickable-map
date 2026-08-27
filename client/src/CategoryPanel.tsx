import { useState } from "react";
import type { FormEvent } from "react";
import { CATEGORY_COLOR_PALETTE, ERASER_TOOL_ID } from "./types";
import type { Category } from "./types";

interface CategoryPanelProps {
  entryName: string;
  onEntryNameChange: (name: string) => void;
  categories: Category[];
  activeTool: string | null;
  onSelectTool: (tool: string | null) => void;
  onAddCategory: (name: string, color: string) => void;
  onRenameCategory: (id: string, name: string) => void;
  onRecolorCategory: (id: string, color: string) => void;
  onDeleteCategory: (id: string) => void;
  assignedCount: number;
  onClearMap: () => void;
  onSubmit: () => void;
  submitting: boolean;
  submitMessage: { type: "success" | "error"; text: string } | null;
  submissionCount: number | null;
}

export function CategoryPanel({
  entryName,
  onEntryNameChange,
  categories,
  activeTool,
  onSelectTool,
  onAddCategory,
  onRenameCategory,
  onRecolorCategory,
  onDeleteCategory,
  assignedCount,
  onClearMap,
  onSubmit,
  submitting,
  submitMessage,
  submissionCount,
}: CategoryPanelProps) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const nextColor = CATEGORY_COLOR_PALETTE[categories.length % CATEGORY_COLOR_PALETTE.length];

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAddCategory(trimmed, nextColor);
    setNewName("");
  };

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const commitEditing = () => {
    if (editingId && editingName.trim()) {
      onRenameCategory(editingId, editingName.trim());
    }
    setEditingId(null);
  };

  return (
    <aside className="category-panel">
      <div>
        <div className="entry-name-field">
          <label htmlFor="entry-name">Entry name</label>
          <input
            id="entry-name"
            type="text"
            placeholder={`Optional — e.g. "Alex's picks"`}
            value={entryName}
            onChange={(e) => onEntryNameChange(e.target.value)}
            maxLength={200}
          />
        </div>

        <h2>Categories</h2>
        <p className="hint">Select a category, then click states to paint them.</p>

        <ul className="category-list">
          {categories.map((category) => (
            <li
              key={category.id}
              className={`category-row ${activeTool === category.id ? "active" : ""}`}
            >
              <button
                type="button"
                className="category-select"
                onClick={() => onSelectTool(category.id)}
                aria-pressed={activeTool === category.id}
              >
                <input
                  type="color"
                  value={category.color}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => onRecolorCategory(category.id, e.target.value)}
                  className="color-swatch"
                  aria-label={`Color for ${category.name}`}
                />
                {editingId === category.id ? (
                  <input
                    type="text"
                    value={editingName}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={commitEditing}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEditing();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="category-name-input"
                  />
                ) : (
                  <span className="category-name">{category.name}</span>
                )}
              </button>
              <button
                type="button"
                className="icon-button"
                title={`Rename ${category.name}`}
                onClick={() => startEditing(category)}
              >
                ✎
              </button>
              <button
                type="button"
                className="icon-button"
                title={`Delete ${category.name}`}
                onClick={() => onDeleteCategory(category.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className={`eraser-row ${activeTool === ERASER_TOOL_ID ? "active" : ""}`}
          onClick={() => onSelectTool(ERASER_TOOL_ID)}
          aria-pressed={activeTool === ERASER_TOOL_ID}
        >
          <span className="color-swatch eraser-swatch" aria-hidden />
          Eraser (clear a state)
        </button>

        <form onSubmit={handleAdd} className="add-category-form">
          <input
            type="text"
            placeholder="New category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={60}
          />
          <button type="submit" disabled={!newName.trim()}>
            Add
          </button>
        </form>
      </div>

      <div className="panel-footer">
        <div className="status-line">
          <span>{assignedCount} of 51 assigned</span>
          <button type="button" className="link-button" onClick={onClearMap} disabled={assignedCount === 0}>
            Clear map
          </button>
        </div>

        <button type="button" className="submit-button" onClick={onSubmit} disabled={submitting}>
          {submitting ? "Submitting…" : "Submit entry"}
        </button>

        {submitMessage && <p className={`submit-message ${submitMessage.type}`}>{submitMessage.text}</p>}
        {submissionCount !== null && <p className="hint">{submissionCount} entries collected so far</p>}
      </div>
    </aside>
  );
}
