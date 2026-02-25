"use client";

import { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  expiresAt: string;
  className?: string;
  onExpire?: () => void;
}

export function CountdownTimer({ expiresAt, className, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);
  const [isLowTime, setIsLowTime] = useState(false);
  const onExpireRef = useRef(onExpire);
  const hasCalledExpireRef = useRef(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft("Expired");
        if (!hasCalledExpireRef.current) {
          hasCalledExpireRef.current = true;
          onExpireRef.current?.();
        }
        return;
      }

      // Less than 5 minutes
      if (diff < 5 * 60 * 1000) {
        setIsLowTime(true);
      } else {
        setIsLowTime(false);
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      setTimeLeft(`${minutes}m ${seconds}s`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium tabular-nums text-muted-foreground",
        (isExpired || isLowTime) && "text-destructive",
        className
      )}
    >
      <Clock className="h-3.5 w-3.5" />
      <span>{timeLeft || "--"}</span>
    </span>
  );
}
