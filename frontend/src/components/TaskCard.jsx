import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const PRIORITY_STYLES = {
  LOW: 'bg-green-100 text-green-700 border-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  HIGH: 'bg-red-100 text-red-700 border-red-200',
};

const PRIORITY_LABELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

/**
 * Returns true if the given due date is in the past.
 */
function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

/**
 * Format a date as a short human-readable string.
 */
function formatDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * TaskCard — draggable card displaying task info.
 */
export default function TaskCard({ task, onEdit, isDragging = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  const overdue = isOverdue(task.dueDate);
  const dueDateStr = formatDate(task.dueDate);
  const assigneeInitial = task.assignee?.name?.charAt(0).toUpperCase() || null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing
        hover:shadow-md hover:border-indigo-300 transition-all select-none
        ${isDragging ? 'shadow-2xl border-indigo-400 rotate-1' : ''}
      `}
      onClick={(e) => {
        // Only trigger edit if not in the middle of a drag
        if (!isSortableDragging) {
          e.stopPropagation();
          onEdit(task);
        }
      }}
    >
      {/* Priority badge + assignee */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.MEDIUM}`}
        >
          {PRIORITY_LABELS[task.priority] || task.priority}
        </span>

        {assigneeInitial && (
          <div
            title={task.assignee?.name}
            className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0"
          >
            {assigneeInitial}
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">
        {task.title}
      </h3>

      {/* Description (truncated) */}
      {task.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{task.description}</p>
      )}

      {/* Due date */}
      {dueDateStr && (
        <div
          className={`flex items-center gap-1 text-xs mt-2 ${
            overdue ? 'text-red-600 font-semibold' : 'text-gray-400'
          }`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {overdue ? `Overdue · ${dueDateStr}` : dueDateStr}
        </div>
      )}
    </div>
  );
}
