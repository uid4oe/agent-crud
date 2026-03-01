import { ListTodo } from "lucide-react";
import { useMemo, useState } from "react";
import {
	DeleteDialog,
	EmptyFilterState,
	EmptyResourceState,
} from "../components/feedback";
import type { FilterConfig, SortOption } from "../components/shared";
import {
	FilterSortBar,
	ResourcePageHeader,
	ResourcePageLayout,
	SearchInput,
} from "../components/shared";
import { TaskForm, TaskKanban } from "../components/tasks";
import { TASK_PRIORITY_OPTIONS } from "../config";
import { useTasks } from "../hooks";
import type { TaskFormSchema } from "../lib/validation";
import type { Task } from "../types";

const TASK_FILTERS: FilterConfig[] = [
	{
		key: "priority",
		label: "All Priorities",
		options: TASK_PRIORITY_OPTIONS,
	},
];

const TASK_SORT_OPTIONS: SortOption[] = [
	{ value: "updatedAt", label: "Recently Updated" },
	{ value: "createdAt", label: "Recently Created" },
	{ value: "title", label: "Title" },
	{ value: "priority", label: "Priority" },
	{ value: "dueDate", label: "Due Date" },
];

export function TasksPage() {
	const [createOpen, setCreateOpen] = useState(false);
	const [editTask, setEditTask] = useState<Task | null>(null);
	const [deleteTask, setDeleteTask] = useState<Task | null>(null);
	const [search, setSearch] = useState("");
	const [filterPriority, setFilterPriority] = useState<string | undefined>();
	const [sortBy, setSortBy] = useState<string | undefined>();
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

	const {
		tasks,
		isLoading,
		error,
		createTask,
		updateTask,
		moveTask,
		deleteTask: removeTask,
		isCreating,
		isUpdating,
		isDeleting,
	} = useTasks({ sortBy, sortOrder });

	const filteredTasks = useMemo(() => {
		if (!tasks) return undefined;
		let result = tasks;

		if (search) {
			const q = search.toLowerCase();
			result = result.filter(
				(task) =>
					task.title.toLowerCase().includes(q) ||
					task.description?.toLowerCase().includes(q) ||
					task.tags?.some((t) => t.toLowerCase().includes(q)),
			);
		}

		if (filterPriority) {
			result = result.filter((task) => task.priority === filterPriority);
		}

		return result;
	}, [tasks, search, filterPriority]);

	const handleCreate = async (data: TaskFormSchema) => {
		await createTask(data);
		setCreateOpen(false);
	};

	const handleUpdate = async (data: TaskFormSchema) => {
		if (!editTask) return;
		await updateTask(editTask.id, data);
		setEditTask(null);
	};

	const handleDelete = async () => {
		if (!deleteTask) return;
		await removeTask(deleteTask.id);
		setDeleteTask(null);
	};

	const taskCount = tasks?.length || 0;
	const filteredCount = filteredTasks?.length || 0;
	const hasActiveFilter = search !== "" || !!filterPriority;

	return (
		<ResourcePageLayout
			isLoading={isLoading}
			error={error}
			resourceName="tasks"
			skeletonColumns={3}
		>
			<ResourcePageHeader
				title="Tasks"
				noun="task"
				totalCount={taskCount}
				filteredCount={filteredCount}
				hasActiveFilter={hasActiveFilter}
				createLabel="New Task"
				onCreate={() => setCreateOpen(true)}
			/>

			{taskCount > 0 && (
				<div className="px-2 space-y-3">
					<SearchInput
						value={search}
						onChange={setSearch}
						placeholder="Search tasks, tags..."
					/>
					<FilterSortBar
						filters={TASK_FILTERS}
						activeFilters={{ priority: filterPriority }}
						onFilterChange={(key, value) => {
							if (key === "priority") setFilterPriority(value);
						}}
						sortOptions={TASK_SORT_OPTIONS}
						activeSort={sortBy}
						sortOrder={sortOrder}
						onSortChange={(s, o) => {
							setSortBy(s);
							setSortOrder(o);
						}}
					/>
				</div>
			)}

			{!tasks?.length ? (
				<EmptyResourceState
					icon={ListTodo}
					title="No tasks yet"
					description="Get started by creating your first task to keep track of what you need to do."
					createLabel="Create Task"
					onCreateClick={() => setCreateOpen(true)}
				/>
			) : filteredTasks && filteredTasks.length === 0 ? (
				<EmptyFilterState
					onClear={() => {
						setSearch("");
						setFilterPriority(undefined);
					}}
				/>
			) : (
				<TaskKanban
					tasks={filteredTasks ?? []}
					onEdit={setEditTask}
					onDelete={setDeleteTask}
					onToggleStatus={(task, newStatus) => moveTask(task.id, newStatus)}
					onMoveToStatus={(task, newStatus) => moveTask(task.id, newStatus)}
				/>
			)}

			<TaskForm
				open={createOpen}
				onOpenChange={setCreateOpen}
				onSubmit={handleCreate}
				title="Create Task"
				isLoading={isCreating}
			/>

			{editTask && (
				<TaskForm
					open={!!editTask}
					onOpenChange={(open) => !open && setEditTask(null)}
					onSubmit={handleUpdate}
					initialData={{
						title: editTask.title,
						description: editTask.description || "",
						status: editTask.status,
						priority: editTask.priority ?? "normal",
						dueDate: editTask.dueDate
							? new Date(editTask.dueDate).toISOString().split("T")[0]
							: "",
						tags: editTask.tags?.join(", ") ?? "",
					}}
					title="Edit Task"
					isLoading={isUpdating}
				/>
			)}

			<DeleteDialog
				open={!!deleteTask}
				onClose={() => setDeleteTask(null)}
				onConfirm={handleDelete}
				isLoading={isDeleting}
				resourceType="Task"
				resourceName={deleteTask?.title}
			/>
		</ResourcePageLayout>
	);
}
