import Link from "next/link";
import { Package, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 mx-auto mb-5">
          <Package size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Product Not Found</h2>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          The product you are trying to view does not exist or has been removed from the database.
        </p>
        <Link href="/products">
          <Button className="w-full flex items-center justify-center gap-2 text-sm py-2.5">
            <ArrowLeft size={16} /> Back to Products
          </Button>
        </Link>
      </div>
    </div>
  );
}
