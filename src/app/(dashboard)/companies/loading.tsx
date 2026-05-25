export default function CompaniesLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse p-1">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded-md" />
          <div className="h-4 w-72 bg-gray-200 rounded-md" />
        </div>
        <div className="h-10 w-36 bg-gray-200 rounded-lg" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="flex gap-4 items-center">
        <div className="flex-grow h-10 bg-gray-200 rounded-lg" />
        <div className="w-64 h-10 bg-gray-200 rounded-lg" />
      </div>

      {/* Table Card Skeleton */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4">
        {/* Table Header */}
        <div className="grid grid-cols-6 border-b border-gray-100 pb-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 w-16 bg-gray-100 rounded" />
          ))}
        </div>

        {/* Table Rows */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="grid grid-cols-6 items-center py-4 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-200 flex-shrink-0" />
              <div className="space-y-1">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-3 w-16 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-5 w-16 bg-gray-200 rounded-full" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-4 w-12 bg-gray-100 rounded justify-self-end" />
          </div>
        ))}
      </div>
    </div>
  );
}
