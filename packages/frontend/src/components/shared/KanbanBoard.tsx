import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Inbox } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { cn } from "../../lib/utils";

export interface KanbanColumn<T extends string = string> {
  key: T;
  label: string;
  emptyText: string;
  color: string;
}

interface KanbanBoardProps<TItem, TColumn extends string> {
  items: TItem[];
  columns: KanbanColumn<TColumn>[];
  getColumnKey: (item: TItem) => TColumn;
  renderItem: (item: TItem) => ReactNode;
  getItemKey: (item: TItem) => string;
  onItemMoved?: (item: TItem, fromColumn: TColumn, toColumn: TColumn) => void;
  layout?: "columns" | "rows";
}

function DraggableItem<TColumn extends string>({
  id,
  columnKey,
  disabled,
  children,
}: {
  id: string;
  columnKey: TColumn;
  disabled: boolean;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { columnKey },
  });

  return (
    <div
      ref={setNodeRef}
      data-entity-id={id}
      {...listeners}
      {...attributes}
      className={cn(
        "touch-none transition-opacity duration-200",
        isDragging && "opacity-30",
        !disabled && "cursor-grab active:cursor-grabbing",
      )}
    >
      {children}
    </div>
  );
}

function DroppableColumn({
  id,
  className,
  children,
}: {
  id: string;
  className: string;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        className,
        "transition-all duration-200",
        isOver && "ring-2 ring-blue-300/60 ring-inset",
      )}
    >
      {children}
    </div>
  );
}

export function KanbanBoard<TItem, TColumn extends string>({
  items,
  columns,
  getColumnKey,
  renderItem,
  getItemKey,
  onItemMoved,
  layout = "columns",
}: KanbanBoardProps<TItem, TColumn>) {
  const [activeItem, setActiveItem] = useState<TItem | null>(null);
  const isDraggable = !!onItemMoved;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const columnKeys = new Set(columns.map((c) => c.key));

  const itemMap = useMemo(
    () => new Map(items.map((item) => [getItemKey(item), item])),
    [items, getItemKey],
  );

  const handleDragStart = (event: DragStartEvent) => {
    const item = itemMap.get(String(event.active.id));
    if (item) setActiveItem(item);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over || !onItemMoved) return;

    const item = itemMap.get(String(active.id));
    if (!item) return;

    const fromColumn = active.data.current?.columnKey as TColumn | undefined;
    const toColumn = String(over.id) as TColumn;

    if (!fromColumn || !columnKeys.has(toColumn) || fromColumn === toColumn) return;
    onItemMoved(item, fromColumn, toColumn);
  };

  const board = layout === "rows" ? (
    <div className="flex flex-col gap-6">
      {columns.map((col) => {
        const columnItems = items.filter(
          (item) => getColumnKey(item) === col.key,
        );
        if (columnItems.length === 0) return null;
        return (
          <div key={col.key}>
            <div className="flex items-center gap-2 mb-3 px-1">
              <h3 className="text-sm font-semibold text-gray-700">
                {col.label}
              </h3>
              <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                {columnItems.length}
              </span>
            </div>
            <DroppableColumn
              id={col.key}
              className={cn(
                "rounded-2xl p-3",
                col.color,
              )}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {columnItems.map((item) => (
                  <DraggableItem
                    key={getItemKey(item)}
                    id={getItemKey(item)}
                    columnKey={col.key}
                    disabled={!isDraggable}
                  >
                    {renderItem(item)}
                  </DraggableItem>
                ))}
              </div>
            </DroppableColumn>
          </div>
        );
      })}
    </div>
  ) : (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 min-h-0",
        columns.length === 3 && "md:grid-cols-3",
        columns.length === 5 && "md:grid-cols-3 lg:grid-cols-5",
      )}
    >
      {columns.map((col) => {
        const columnItems = items.filter(
          (item) => getColumnKey(item) === col.key,
        );
        return (
          <div key={col.key} className="flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-3 px-1">
              <h3 className="text-sm font-semibold text-gray-700">
                {col.label}
              </h3>
              <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                {columnItems.length}
              </span>
            </div>
            <DroppableColumn
              id={col.key}
              className={cn(
                "flex-1 rounded-2xl p-3 space-y-3 min-h-[120px]",
                col.color,
              )}
            >
              {columnItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center pt-8 pb-4">
                  <Inbox className="h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-xs text-gray-400 text-center">
                    {col.emptyText}
                  </p>
                </div>
              ) : (
                columnItems.map((item) => (
                  <DraggableItem
                    key={getItemKey(item)}
                    id={getItemKey(item)}
                    columnKey={col.key}
                    disabled={!isDraggable}
                  >
                    {renderItem(item)}
                  </DraggableItem>
                ))
              )}
            </DroppableColumn>
          </div>
        );
      })}
    </div>
  );

  if (!isDraggable) return board;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {board}
      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <div className="opacity-90 rotate-2 scale-105 pointer-events-none shadow-lg transition-transform duration-200">
            {renderItem(activeItem)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
