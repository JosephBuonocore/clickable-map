import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { UsMap } from "./UsMap";
import { CategoryPanel } from "./CategoryPanel";
import { submitEntry, fetchSubmissionCount } from "./api";
import { ERASER_TOOL_ID } from "./types";
import type { Assignments, Category } from "./types";

const CATEGORIES_STORAGE_KEY = "survey-map:categories";

function loadStoredCategories(): Category[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function App() {
  const [categories, setCategories] = useState<Category[]>(loadStoredCategories);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignments>({});
  const [entryName, setEntryName] = useState("");
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submissionCount, setSubmissionCount] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    fetchSubmissionCount().then(setSubmissionCount);
  }, []);

  const assignedCount = useMemo(() => Object.keys(assignments).length, [assignments]);

  const handleAddCategory = (name: string, color: string) => {
    const category: Category = { id: crypto.randomUUID(), name, color };
    setCategories((prev) => [...prev, category]);
    setActiveTool(category.id);
  };

  const handleRenameCategory = (id: string, name: string) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
  };

  const handleRecolorCategory = (id: string, color: string) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, color } : c)));
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setAssignments((prev) => {
      const next: Assignments = {};
      for (const [state, categoryIds] of Object.entries(prev)) {
        const filtered = categoryIds.filter((catId) => catId !== id);
        if (filtered.length > 0) next[state] = filtered;
      }
      return next;
    });
    setActiveTool((current) => (current === id ? null : current));
  };

  const handleSelectTool = (tool: string | null) => {
    setActiveTool((current) => (current === tool ? null : tool));
  };

  // Clicking a state with the active category toggles that one category on/off for
  // it, so a state can end up in several categories at once. The eraser instead wipes
  // every category off the state in one click.
  const handleStateClick = (stateName: string) => {
    if (!activeTool) return;
    setAssignments((prev) => {
      if (activeTool === ERASER_TOOL_ID) {
        if (!(stateName in prev)) return prev;
        const next = { ...prev };
        delete next[stateName];
        return next;
      }
      const current = prev[stateName] ?? [];
      const updated = current.includes(activeTool)
        ? current.filter((catId) => catId !== activeTool)
        : [...current, activeTool];
      const next = { ...prev };
      if (updated.length === 0) {
        delete next[stateName];
      } else {
        next[stateName] = updated;
      }
      return next;
    });
  };

  const handleClearMap = () => setAssignments({});

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitMessage(null);
    try {
      const result = await submitEntry(entryName, categories, assignments);
      setAssignments({});
      setEntryName("");
      setSubmitMessage({ type: "success", text: `Saved as "${result.name}". Map cleared for a new one.` });
      const count = await fetchSubmissionCount();
      setSubmissionCount(count);
    } catch (err) {
      setSubmitMessage({ type: "error", text: err instanceof Error ? err.message : "Submission failed." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>State Survey Map</h1>
        <p>Define your own categories, then click states to sort them however you like.</p>
      </header>

      <main className="app-main">
        <div className="map-container">
          <UsMap
            categories={categories}
            assignments={assignments}
            paintingEnabled={activeTool !== null}
            onStateClick={handleStateClick}
            hoveredState={hoveredState}
            onHoverState={setHoveredState}
          />
        </div>

        <CategoryPanel
          entryName={entryName}
          onEntryNameChange={setEntryName}
          categories={categories}
          activeTool={activeTool}
          onSelectTool={handleSelectTool}
          onAddCategory={handleAddCategory}
          onRenameCategory={handleRenameCategory}
          onRecolorCategory={handleRecolorCategory}
          onDeleteCategory={handleDeleteCategory}
          assignedCount={assignedCount}
          onClearMap={handleClearMap}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitMessage={submitMessage}
          submissionCount={submissionCount}
        />
      </main>
    </div>
  );
}

export default App;
