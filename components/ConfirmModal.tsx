"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  productName?: string;
  productSku?: string;
  productCategory?: string;
  productPrice?: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Hapus",
  cancelText = "Batal",
  productName,
  productSku,
  productCategory,
  productPrice,
}: ConfirmModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        // Sama persis dengan modal edit produk
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-[#dac1b8]/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="font-serif text-xl text-[#28180b]">{title}</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-[#ffdad6] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-[#54433c]" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              <p className="text-[#54433c] text-sm leading-relaxed mb-4">{message}</p>
              
              {/* Product Info */}
              {(productName || productSku || productCategory || productPrice) && (
                <div className="bg-[#fff1e9] rounded-xl p-4">
                  {productName && (
                    <p className="font-semibold text-[#28180b]">{productName}</p>
                  )}
                  {productSku && (
                    <p className="text-xs text-[#54433c]/60 mt-0.5">SKU: {productSku}</p>
                  )}
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-[#dac1b8]/20">
                    {productCategory && (
                      <span className="text-xs text-[#823b18] font-medium">{productCategory}</span>
                    )}
                    {productPrice && (
                      <span className="text-sm font-semibold text-[#823b18]">{productPrice}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-[#dac1b8] text-[#54433c] rounded-xl text-sm font-semibold hover:bg-[#fff1e9] transition-all cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition-all cursor-pointer"
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}