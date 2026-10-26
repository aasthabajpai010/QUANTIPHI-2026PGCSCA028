import { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import TaskCard from './TaskCard.jsx';
import api from '../api/axios.js';

const COLUMNS = [
  {
    id: 'TODO',
    label: 'To Do',
    color: 'bg-gray-200 text-gray-700',
    headerColor: 'border-gray-300',
    badgeColor: 'bg-gray-200 text-gray-700',
  },
  {
    id: 'IN_PROGRESS',
    label: 'In Progress',
    color: 'bg-blue-100 text-blue-700',
    headerColor: 'border-blue-300',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'DONE',
    label: 'Done',
    color: 'bg-green-100 text-green-700',
    headerColor: 'border-green-300',
    badgeColor: 'bg-green-100 text-green-700',
  },
];

/**
 * Droppable column component.
 */
function KanbanColumn({ column, tasks, onEditTask }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col bg-gray-50 rounded-xl border-2 transition-colors min-h-[500px] ${
        isOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200'
      }`}
    >
      {/* Column header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b-2 ${column.headerColor} rounded-t-xl`}>
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-800 text-sm">{column.label}</h2>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${column.badgeColor}`}>
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Task cards */}
      <div className="flex-1 p-3 flex flex-col gap-2 overflow-y-auto">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={onEditTask} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-gray-400 text-center py-8">
              Drop tasks here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * KanbanBoard — 3-column drag-and-drop board.
 */
export default function KanbanBoard({ tasks, onStatusChange, onEditTask, projectId }) {
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Group tasks by status
  const tasksByStatus = {
    TODO: tasks.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS'),
    DONE: tasks.filter((t) => t.status === 'DONE'),
  };

  const handleDragStart = (event) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event) => {
    setActiveTask(null);
    const { active, over } = event;

    if (!over) return;

    // Determine the target column
    let targetStatus = null;

    // Check if dropped directly on a column droppable
    if (['TODO', 'IN_PROGRESS', 'DONE'].includes(over.id)) {
      targetStatus = over.id;
    } else {
      // Dropped on another task — find that task's column
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    if (!targetStatus) return;

    const draggedTask = tasks.find((t) => t.id === active.id);
    if (!draggedTask || draggedTask.status === targetStatus) return;

    // Optimistic update
    onStatusChange(draggedTask.id, targetStatus);

    // Persist to server
    try {
      await api.put(`/tasks/${draggedTask.id}`, { status: targetStatus });
    } catch (err) {
      console.error('Failed to update task status:', err);
      // Revert optimistic update on failure
      onStatusChange(draggedTask.id, draggedTask.status);
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-3 gap-4 h-full min-w-[700px]">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasksByStatus[column.id]}
            onEditTask={onEditTask}
          />
        ))}
      </div>

      {/* Drag overlay — ghost card while dragging */}
      <DragOverlay>
        {activeTask ? (
          <div className="opacity-90 rotate-1 shadow-2xl">
            <TaskCard task={activeTask} onEdit={() => {}} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
