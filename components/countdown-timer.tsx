"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  expiresAt: string;
}

export function CountdownTimer({ expiresAt }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft("Expired");
        return;
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
    <div
      className={`flex items-center gap-2 rounded-lg border px-2 py-1 text-sm font-medium ${
        isExpired
          ? "border-red-300 bg-red-100 text-red-500 dark:border-red-800 dark:bg-red-900/20"
          : "border-red-200 bg-red-50 text-red-600 dark:border-red-800/50 dark:bg-red-900/10 dark:text-red-400"
      }`}
    >
      <Clock className="h-4 w-4" />
      <span>{timeLeft || "Calculating..."}</span>
    </div>
  );
}
