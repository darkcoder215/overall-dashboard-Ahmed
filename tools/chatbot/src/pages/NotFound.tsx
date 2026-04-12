import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F4EE]" dir="rtl">
      <div className="animate-scale-in text-center">
        {/* Large 404 in brand Serif Display */}
        <h1 className="mb-4 font-display text-7xl font-black text-black">
          404
        </h1>
        <p className="mb-6 font-body text-lg text-[#494C6B]">
          الصفحة غير موجودة
        </p>
        <a
          href="/"
          className="inline-block rounded-full bg-black px-8 py-3 font-ui text-sm font-bold text-white transition-all duration-200 hover:bg-[#2B2D3F] hover:shadow-md"
        >
          العودة للرئيسية
        </a>
      </div>
    </div>
  );
};

export default NotFound;
