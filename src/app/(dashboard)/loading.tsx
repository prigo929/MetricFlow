export default function Loading() {
  return (
    <div className="w-full space-y-6 animate-pulse p-1">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-gray-200 rounded-md" />
        <div className="h-4 w-72 bg-gray-200 rounded-md" />
      </div>

      {/* KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-white border border-gray-100 rounded-xl p-6 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-5 w-5 bg-gray-200 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-7 w-20 bg-gray-200 rounded" />
              <div className="h-3 w-16 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 h-[350px] bg-white border border-gray-100 rounded-xl p-6 space-y-4 shadow-sm">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-full w-full bg-gray-100/50 rounded-lg" />
        </div>
        <div className="h-[350px] bg-white border border-gray-100 rounded-xl p-6 space-y-4 shadow-sm">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-full w-full bg-gray-100/50 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
