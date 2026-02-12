const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7:00-19:00

const HeatmapChart = ({ data = [] }) => {
  // Build matrix
  const matrix = {};
  let maxCount = 0;
  data.forEach(({ day, hour, count }) => {
    const key = `${day}-${hour}`;
    matrix[key] = count;
    if (count > maxCount) maxCount = count;
  });

  const getColor = (count) => {
    if (!count) return 'bg-slate-50 dark:bg-slate-800';
    const intensity = count / maxCount;
    if (intensity > 0.75) return 'bg-blue-600 text-white';
    if (intensity > 0.5) return 'bg-blue-400 text-white';
    if (intensity > 0.25) return 'bg-blue-200 text-blue-800';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Header row - hours */}
        <div className="flex gap-1 mb-1 mr-16">
          {HOURS.map(h => (
            <div key={h} className="flex-1 text-center text-xs text-slate-500 font-medium">
              {String(h).padStart(2, '0')}
            </div>
          ))}
        </div>

        {/* Day rows */}
        {DAYS.map((dayName, i) => {
          const dayNum = i + 1; // MongoDB: 1=Sun
          return (
            <div key={dayNum} className="flex gap-1 mb-1 items-center">
              <div className="w-14 text-right text-xs text-slate-600 dark:text-slate-400 font-medium shrink-0">
                {dayName}
              </div>
              {HOURS.map(h => {
                const count = matrix[`${dayNum}-${h}`] || 0;
                return (
                  <div
                    key={h}
                    className={`flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all cursor-default ${getColor(count)}`}
                    title={`${dayName} ${String(h).padStart(2, '0')}:00 - ${count} תורים`}
                  >
                    {count > 0 ? count : ''}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 justify-center">
          <span className="text-xs text-slate-500">פחות</span>
          <div className="w-6 h-4 rounded bg-slate-50 border border-slate-200" />
          <div className="w-6 h-4 rounded bg-blue-100" />
          <div className="w-6 h-4 rounded bg-blue-200" />
          <div className="w-6 h-4 rounded bg-blue-400" />
          <div className="w-6 h-4 rounded bg-blue-600" />
          <span className="text-xs text-slate-500">יותר</span>
        </div>
      </div>
    </div>
  );
};

export default HeatmapChart;
