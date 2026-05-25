export default function ContactsLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse p-1">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded-md" />
          <div className="h-4 w-72 bg-gray-200 rounded-md" />
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-lg" />
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="h-4 w-28 bg-gray-200 rounded" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </div>
              <div className="h-5 w-14 bg-gray-100 rounded-full flex-shrink-0" />
            </div>
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="space-y-1.5 pt-1">
              <div className="h-3.5 w-full bg-gray-100 rounded" />
              <div className="h-3.5 w-32 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
