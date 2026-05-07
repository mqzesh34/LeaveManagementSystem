import React, { useRef, useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const Popup: React.FC<PopupProps> = ({ isOpen, onClose, title, children, className = "max-w-4xl" }) => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [lineWidth, setLineWidth] = useState(0);

  useEffect(() => {
    if (isOpen && titleRef.current) {
      setLineWidth(titleRef.current.offsetWidth);
    }
  }, [isOpen, title]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed cursor-default inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
            className={`bg-white rounded-2xl shadow-2xl w-full ${className} max-h-[90vh] flex flex-col overflow-hidden relative z-10`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 pb-0 border-gray-100">
              <div className="flex text-center items-center gap-3">
                <h2 ref={titleRef} className="text-2xl font-bold text-gray-800">{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-[31px] h-[31px] cursor-pointer" />
              </button>
            </div>

            <div className="h-1 mx-6 rounded-full bg-gray-200 shrink-0 transition-all duration-300"
              style={{ width: lineWidth > 0 ? `${lineWidth}px` : "35%" }}
            ></div>

            <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Popup;
