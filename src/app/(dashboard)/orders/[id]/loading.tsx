export default function OrderDetailLoading() {
  return (
    <div className="max-w-4xl w-full space-y-6 animate-pulse p-1">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded-md" />
          <div className="h-4 w-64 bg-gray-200 rounded-md" />
        </div>
        <div className="h-10 w-36 bg-gray-200 rounded-lg" />
      </div>

      {/* Status Card Skeleton */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="space-y-1.5">
            <div className="h-3 w-12 bg-gray-100 rounded" />
            <div className="h-6 w-20 bg-gray-200 rounded-full" />
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="h-4 w-32 bg-gray-200 rounded" />
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="h-4 w-28 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="h-9 w-36 bg-gray-100 rounded-lg" />
      </div>

      {/* Order Items Table Card Skeleton */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4">
        <div className="h-5 w-28 bg-gray-200 rounded mb-2" />
        <div className="grid grid-cols-6 border-b border-gray-100 pb-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 w-16 bg-gray-100 rounded" />
          ))}
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="grid grid-cols-6 py-4 border-b border-gray-50 last:border-0">
            <div className="h-4 w-32 bg-gray-200 rounded col-span-1" />
            <div className="h-4 w-20 bg-gray-200 rounded font-mono text-xs" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-4 w-8 bg-gray-200 rounded" />
            <div className="h-4 w-16 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-200 rounded font-semibold" />
          </div>
        ))}
        {/* Total */}
        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
          <div className="h-4 w-12 bg-gray-200 rounded" />
          <div className="h-6 w-24 bg-brand-500/20 rounded" />
        </div>
      </div>
    </div>
  );
}
