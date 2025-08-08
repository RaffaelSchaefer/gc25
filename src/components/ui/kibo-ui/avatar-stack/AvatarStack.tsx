"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AvatarStackProps {
  avatars: Array<{
    id: string;
    name: string;
    image?: string;
    fallback?: string;
  }>;
  maxVisible?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-base",
};

const overlapClasses = {
  sm: "-ml-1",
  md: "-ml-2",
  lg: "-ml-3",
};

export function AvatarStack({
  avatars,
  maxVisible = 5,
  size = "md",
  className,
}: AvatarStackProps) {
  const visibleAvatars = avatars.slice(0, maxVisible);
  const hiddenCount = avatars.length - maxVisible;

  return (
    <TooltipProvider>
      <div className={cn("flex items-center", className)}>
        {visibleAvatars.map((avatar, index) => (
          <Tooltip key={avatar.id}>
            <TooltipTrigger asChild>
              <Avatar
                className={cn(
                  sizeClasses[size],
                  index > 0 && overlapClasses[size],
                  "border-2 border-background hover:scale-110 transition-transform cursor-pointer",
                )}
              >
                <AvatarImage src={avatar.image} alt={avatar.name} />
                <AvatarFallback>
                  {avatar.fallback || avatar.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{avatar.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        {hiddenCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  sizeClasses[size],
                  overlapClasses[size],
                  "flex items-center justify-center rounded-full bg-muted border-2 border-background text-muted-foreground font-medium hover:scale-110 transition-transform cursor-pointer",
                )}
              >
                +{hiddenCount}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{hiddenCount} more attendees</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
