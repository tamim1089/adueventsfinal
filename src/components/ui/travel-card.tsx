import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface TravelCardProps extends React.HTMLAttributes<HTMLDivElement> {
  imageUrl: string;
  imageAlt: string;
  logo?: React.ReactNode;
  title: string;
  location: string;
  overview: string;
  price: number | string;
  pricePeriod: string;
  onBookNow: () => void;
}

const TravelCard = React.forwardRef<HTMLDivElement, TravelCardProps>(
  (
    { className, imageUrl, imageAlt, logo, title, location, overview, price, pricePeriod, onBookNow, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "group relative w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg",
          "transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-2",
          className
        )}
        {...props}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={imageAlt}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

        <div className="relative flex h-full flex-col justify-between p-6 text-white">
          <div className="flex h-40 items-start">
            {logo && (
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/50 bg-black/20 backdrop-blur-sm">
                {logo}
              </div>
            )}
          </div>

          <div className="space-y-4 transition-transform duration-500 ease-in-out group-hover:-translate-y-16">
            <div>
              <h3 className="text-2xl font-bold text-white">{title}</h3>
              <p className="text-sm text-white/80">{location}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/90">Overview</h4>
              <p className="text-sm leading-relaxed text-white/70">{overview}</p>
            </div>
          </div>

          <div className="absolute -bottom-20 left-0 w-full p-6 opacity-0 transition-all duration-500 ease-in-out group-hover:bottom-0 group-hover:opacity-100">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-3xl font-bold text-white">{price}</span>
                <span className="text-white/80"> {pricePeriod}</span>
              </div>
              <Button onClick={onBookNow} size="lg" className="bg-white text-black hover:bg-white/90">
                Details <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
TravelCard.displayName = "TravelCard";

export { TravelCard };
