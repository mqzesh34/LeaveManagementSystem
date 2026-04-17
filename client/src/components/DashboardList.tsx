import React, { useEffect, useRef, useState } from "react";

interface DashboardListProps<T> {
  allItems: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeightDefault?: number;
  itemHeightUnzoomed?: number;
  loading?: boolean;
  emptyText?: string;
}

function DashboardList<T>({
  allItems,
  renderItem,
  itemHeightDefault = 62,
  itemHeightUnzoomed = 54,
  loading = false,
  emptyText = "Kayıt bulunamadı.",
}: DashboardListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    const calculateCount = () => {
      if (!containerRef.current) return;

      const isUnzoomed = window.innerWidth <= 1200;
      const itemHeight = isUnzoomed ? itemHeightUnzoomed : itemHeightDefault;
      const height = containerRef.current.getBoundingClientRect().height;

      const count = Math.max(1, Math.floor((height - 5) / itemHeight));
      setVisibleCount(count);
    };

    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(calculateCount);
    });

    if (containerRef.current) observer.observe(containerRef.current);
    calculateCount();

    return () => observer.disconnect();
  }, [itemHeightDefault, itemHeightUnzoomed, loading]);

  const visibleItems = allItems.slice(0, visibleCount);

  return (
    <div className="flex-1 min-h-0 relative">
      <div
        ref={containerRef}
        className="space-y-2 h-full overflow-y-auto no-scrollbar"
      >
        {allItems.length === 0 ? (
          <p className="text-sm text-gray-400 italic text-center mt-4">
            {emptyText}
          </p>
        ) : (
          visibleItems.map((item, index) => renderItem(item, index))
        )}
      </div>
      {allItems.length > 0 && allItems.length <= visibleCount && (
        <p className="absolute bottom-0 left-0 right-0 text-center text-xs text-gray-400 italic pointer-events-none">
          - Daha fazla kayıt yok -
        </p>
      )}
    </div>
  );
}

export default DashboardList;
