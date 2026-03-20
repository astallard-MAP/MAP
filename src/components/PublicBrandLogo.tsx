import { cn } from "@/lib/utils";
import Image from "next/image";

const PublicBrandLogo = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center select-none",
        className
      )}
    >
      <Image
        src="/logo.png"
        alt="The Auction Department Logo"
        width={240}
        height={80}
        priority
        unoptimized
        className="drop-shadow-sm"
      />
    </div>
  );
};

export default PublicBrandLogo;
