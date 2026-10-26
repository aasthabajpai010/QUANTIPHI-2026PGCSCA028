/**
 * TeamSidebar — shows project members with their IN_PROGRESS task counts.
 * Members with > 5 in-progress tasks get a pulsing red avatar ring.
 */
export default function TeamSidebar({ workload }) {
  if (!workload || workload.length === 0) return null;

  return (
    <div className="px-4 pb-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-4">
        Team Workload
      </h3>

      <div className="space-y-2">
        {workload.map((member) => {
          const overloaded = member.inProgressCount > 5;
          const initial = member.name?.charAt(0).toUpperCase() || '?';

          return (
            <div
              key={member.userId}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition"
              title={`${member.name} — ${member.inProgressCount} task${member.inProgressCount !== 1 ? 's' : ''} in progress`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${overloaded
                      ? 'bg-red-100 text-red-700 animate-pulse-red ring-2 ring-red-500'
                      : 'bg-indigo-100 text-indigo-700'
                    }`}
                >
                  {initial}
                </div>
                {overloaded && (
                  <span
                    className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
                    title="Overloaded: more than 5 tasks in progress"
                  />
                )}
              </div>

              {/* Name + count */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{member.name}</p>
                <p className={`text-xs ${overloaded ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                  {member.inProgressCount} in progress
                  {overloaded && ' ⚠️'}
                </p>
              </div>

              {/* Role badge */}
              {member.role === 'ADMIN' && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                  Admin
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
