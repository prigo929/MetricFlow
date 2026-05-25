export default function CompanyDetailLoading() {
  return (
    <div className="max-w-5xl w-full space-y-6 animate-pulse p-1">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gray-200 rounded-md" />
          <div className="h-4 w-48 bg-gray-200 rounded-md" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-16 bg-gray-200 rounded-lg" />
          <div className="h-9 w-24 bg-gray-200 rounded-lg" />
        </div>
      </div>

      {/* Grid Layout (Information + summary) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Info Card Skeleton */}
        <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="h-5 w-40 bg-gray-200 rounded" />
          <div className="grid grid-cols-2 gap-6 pt-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3.5 w-24 bg-gray-100 rounded" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Summary Card Skeleton */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
          <div className="h-5 w-32 bg-gray-200 rounded" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-20 bg-gray-100 rounded" />
              <div className="h-6 w-28 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Contacts Skeleton */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="h-5 w-24 bg-gray-200 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="space-y-1.5 flex-grow">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-24 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
