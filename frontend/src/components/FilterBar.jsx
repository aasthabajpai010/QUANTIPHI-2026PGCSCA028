export default function FilterBar({ priorityFilter, setPriorityFilter, taskCounts }) {
  const filters = [
    { label: 'All', value: 'ALL' },
    { label: 'Low', value: 'LOW', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
    { label: 'Medium', value: 'MEDIUM', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
    { label: 'High', value: 'HIGH', color: 'text-rose-400 border-rose-500/40 bg-rose-500/10' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 mb-6 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm backdrop-blur-sm">
      {/* Filter Buttons */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-2">Filter Priority:</span>
        <div className="inline-flex p-1 rounded-lg bg-slate-950 border border-slate-800/80">
          {filters.map((f) => {
            const isActive = priorityFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setPriorityFilter(f.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Task Summary Badges */}
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          <span>To Do:</span>
          <span className="font-bold text-white">{taskCounts?.TODO ?? 0}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span>In Progress:</span>
          <span className="font-bold text-white">{taskCounts?.IN_PROGRESS ?? 0}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Done:</span>
          <span className="font-bold text-white">{taskCounts?.DONE ?? 0}</span>
        </div>
      </div>
    </div>
  );
}
