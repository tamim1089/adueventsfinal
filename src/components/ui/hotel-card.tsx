import * as React from "react";
import { motion } from "framer-motion";
import { MapPin, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HotelCardProps extends React.HTMLAttributes<HTMLDivElement> {
  imageUrl: string;
  imageAlt: string;
  roomType: string;       // organizer
  hotelName: string;      // event title
  location: string;       // venue
  rating: number;         // not shown as stars here — reused as a small meta
  reviewCount: number;    // reused as attendee count
  href?: string;
  when?: string;
}

const HotelCard = React.forwardRef<HTMLDivElement, HotelCardProps>(
  (
    { className, imageUrl, imageAlt, roomType, hotelName, location, rating: _rating, reviewCount, href, when, ...props },
    ref
  ) => {
    void _rating;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Component: React.ElementType = href ? (motion.a as any) : (motion.div as any);
    return (
      <Component
        ref={ref}
        href={href}
        className={cn(
          "group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-300 ease-in-out hover:shadow-lg md:flex-row",
          className
        )}
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300 }}
        {...props}
      >
        <div className="h-48 w-full overflow-hidden md:h-auto md:w-2/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={imageAlt}
            className="h-full w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
          />
        </div>
        <div className="flex flex-col justify-center space-y-2 p-6 md:w-3/5">
          <span className="text-sm text-muted-foreground">{roomType}</span>
          <h3 className="text-xl font-bold tracking-tight">{hotelName}</h3>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{location}</span>
          </div>
          {when && (
            <div className="flex items-center pt-1 text-muted-foreground">
              <CalendarDays className="mr-2 h-4 w-4 fill-primary/10 text-primary" />
              <span className="text-sm font-semibold text-foreground">{when}</span>
              <span className="ml-1.5 text-sm">· {reviewCount.toLocaleString()} attending</span>
            </div>
          )}
        </div>
      </Component>
    );
  }
);
HotelCard.displayName = "HotelCard";

export { HotelCard };
