import { useState, useMemo } from "react";
import { Target } from "lucide-react";
import { GoalKanbanBoard, GoalForm } from "../components/goals";
import { DeleteDialog, EmptyFilterState, EmptyResourceState } from "../components/feedback";
import { ResourcePageLayout, ResourcePageHeader, SearchInput, FilterSortBar } from "../components/shared";
import { useGoals } from "../hooks";
import { GOAL_CATEGORY_OPTIONS } from "../config";
import type { Goal } from "../types";
import type { GoalFormSchema } from "../lib/validation";
import type { FilterConfig, SortOption } from "../components/shared";

const GOAL_FILTERS: FilterConfig[] = [
  {
    key: "category",
    label: "All Categories",
    options: GOAL_CATEGORY_OPTIONS,
  },
];

const GOAL_SORT_OPTIONS: SortOption[] = [
  { value: "updatedAt", label: "Recently Updated" },
  { value: "createdAt", label: "Recently Created" },
  { value: "title", label: "Title" },
  { value: "targetDate", label: "Target Date" },
];

export function WellnessPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [deleteGoal, setDeleteGoal] = useState<Goal | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const {
    goals,
    isLoading,
    error,
    createGoal,
    updateGoal,
    moveGoal,
    deleteGoal: removeGoal,
    toggleMilestone,
    isCreating,
    isUpdating,
    isDeleting,
  } = useGoals({ sortBy, sortOrder });

  const filteredGoals = useMemo(() => {
    if (!goals) return undefined;
    let result = goals;

    if (search) {
      const query = search.toLowerCase();
      result = result.filter((g) =>
        g.title.toLowerCase().includes(query) ||
        g.description?.toLowerCase().includes(query)
      );
    }

    if (filterCategory) {
      result = result.filter((g) => g.category === filterCategory);
    }

    return result;
  }, [goals, search, filterCategory]);

  const handleCreate = async (data: GoalFormSchema) => {
    await createGoal(data);
    setCreateOpen(false);
  };

  const handleUpdate = async (data: GoalFormSchema) => {
    if (!editGoal) return;
    await updateGoal(editGoal.id, data);
    setEditGoal(null);
  };

  const handleDelete = async () => {
    if (!deleteGoal) return;
    await removeGoal(deleteGoal.id);
    setDeleteGoal(null);
  };

  const goalCount = goals?.length || 0;
  const filteredCount = filteredGoals?.length || 0;
  const hasActiveFilter = search !== "" || !!filterCategory;

  return (
    <ResourcePageLayout
      isLoading={isLoading}
      error={error}
      resourceName="goals"
      skeletonColumns={3}
    >
      <ResourcePageHeader
        title="Wellness"
        noun="goal"
        totalCount={goalCount}
        filteredCount={filteredCount}
        hasActiveFilter={hasActiveFilter}
        createLabel="New Goal"
        onCreate={() => setCreateOpen(true)}
      />

      {goalCount > 0 && (
        <div className="px-2 space-y-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search goals..." />
          <FilterSortBar
            filters={GOAL_FILTERS}
            activeFilters={{ category: filterCategory }}
            onFilterChange={(key, value) => {
              if (key === "category") setFilterCategory(value);
            }}
            sortOptions={GOAL_SORT_OPTIONS}
            activeSort={sortBy}
            sortOrder={sortOrder}
            onSortChange={(s, o) => { setSortBy(s); setSortOrder(o); }}
          />
        </div>
      )}

      {!goals?.length ? (
        <EmptyResourceState
          icon={Target}
          title="No goals yet"
          description="Get started by creating your first wellness goal to track your fitness, nutrition, mindfulness, and sleep habits."
          createLabel="Create Goal"
          onCreateClick={() => setCreateOpen(true)}
        />
      ) : filteredGoals && filteredGoals.length === 0 ? (
        <EmptyFilterState onClear={() => { setSearch(""); setFilterCategory(undefined); }} />
      ) : (
        <GoalKanbanBoard
          goals={filteredGoals ?? []}
          onEdit={setEditGoal}
          onDelete={setDeleteGoal}
          onToggleMilestone={toggleMilestone}
          onMoveToStatus={(goal, status) => moveGoal(goal.id, status)}
        />
      )}

      <GoalForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        title="Create Goal"
        isLoading={isCreating}
      />

      {editGoal && (
        <GoalForm
          open={!!editGoal}
          onOpenChange={(open) => !open && setEditGoal(null)}
          onSubmit={handleUpdate}
          initialData={{
            title: editGoal.title,
            description: editGoal.description || "",
            status: editGoal.status,
            category: editGoal.category,
            targetDate: editGoal.targetDate
              ? new Date(editGoal.targetDate).toISOString().split("T")[0]
              : "",
            milestones: editGoal.milestones
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((m) => ({ id: m.id, title: m.title, completed: m.completed })),
          }}
          title="Edit Goal"
          isLoading={isUpdating}
        />
      )}

      <DeleteDialog
        open={!!deleteGoal}
        onClose={() => setDeleteGoal(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        resourceType="Goal"
        resourceName={deleteGoal?.title}
      />
    </ResourcePageLayout>
  );
}
