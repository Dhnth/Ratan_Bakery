"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, X, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast = ({ message, type, onClose, duration = 3000 }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const colors = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, y: -20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 50, y: -20 }}
      className={`fixed top-20 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${colors[type]}`}
    >
      {icons[type]}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

// Toast container
let toastContainer: HTMLDivElement | null = null;

export const showToast = (message: string, type: ToastType = "success") => {
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    document.body.appendChild(toastContainer);
  }

  const toastId = Date.now();
  const toastElement = document.createElement("div");
  toastContainer.appendChild(toastElement);

  const removeToast = () => {
    toastElement.remove();
  };

  // Render toast dengan cara sederhana (React bisa lebih kompleks, ini solusi cepat)
  const ToastComponent = () => {
    const [isVisible, setIsVisible] = useState(true);
    useEffect(() => {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(removeToast, 300);
      }, 3000);
      return () => clearTimeout(timer);
    }, []);
    if (!isVisible) return null;
    return (
      <motion.div
        initial={{ opacity: 0, x: 50, y: -20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: 50, y: -20 }}
        className={`fixed top-20 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${
          type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-red-50 border-red-200 text-red-800"
        }`}
      >
        {type === "success" ? (
          <CheckCircle className="w-5 h-5 text-emerald-500" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-500" />
        )}
        <span className="text-sm font-medium">{message}</span>
      </motion.div>
    );
  };

  // Render sederhana menggunakan innerHTML untuk toast
  const toastDiv = document.createElement("div");
  toastDiv.className = `fixed top-20 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${
    type === "success"
      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
      : "bg-red-50 border-red-200 text-red-800"
  }`;
  toastDiv.innerHTML = `
    <div class="flex items-center gap-3">
      ${type === "success" ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'}
      <span class="text-sm font-medium">${message}</span>
    </div>
  `;
  toastContainer.appendChild(toastDiv);
  setTimeout(() => {
    toastDiv.style.opacity = "0";
    toastDiv.style.transform = "translateX(50px)";
    setTimeout(() => toastDiv.remove(), 300);
  }, 3000);
};