import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

interface NotificationProps {
  message: string;
  duration?: number; // milliseconds
  onClose: () => void;
}

const Notification = ({ message, duration = 2000, onClose }: NotificationProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-5 duration-300">
      <div className="bg-background/90 backdrop-blur-sm border border-border rounded-lg shadow-lg px-4 py-3 flex items-center gap-2 min-w-[280px]">
        <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="text-sm font-medium text-foreground">{message}</span>
      </div>
    </div>
  );
};

export { Notification };