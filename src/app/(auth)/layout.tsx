export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 14l4-4 3 3 4-5 3 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">MetricFlow</span>
          </div>
          <p className="text-brand-300 text-sm">B2B Sales Intelligence Platform</p>
        </div>
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
