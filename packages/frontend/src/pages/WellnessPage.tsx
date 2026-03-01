import { useState, useMemo } from "react";
import { Target } from "lucide-react";
import { GoalKanbanBoard, GoalForm } from "../components/goals";
import { PageError, EmptyFilterState, EmptyResourceState, DeleteDialog } from "../components/feedback";
import { ResourcePageHeader, SearchInput, FilterSortBar } from "../components/shared";
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

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between pb-2 px-2">
          <div>
            <div className="h-8 w-28 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-4 w-20 bg-gray-100 rounded mt-2 animate-pulse" />
          </div>
          <div className="h-11 w-32 bg-gray-100 rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-gray-50 p-3 min-h-[200px]">
              <div className="h-4 w-16 bg-gray-100 rounded animate-pulse mb-3" />
              <div className="rounded-2xl border border-gray-100 p-5 space-y-3">
                <div className="h-8 w-8 bg-gray-100 rounded-xl animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-full bg-gray-50 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) return <PageError resourceName="goals" message={error.message} />;

  const goalCount = goals?.length || 0;
  const filteredCount = filteredGoals?.length || 0;
  const hasActiveFilter = search !== "" || !!filterCategory;

  return (
    <div className="space-y-6 h-full overflow-y-auto p-6 pt-14 md:pt-8 md:p-8 max-w-7xl mx-auto w-full">
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
          goals={filteredGoals!}
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
    </div>
  );
}
