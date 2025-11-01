import React, { useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PortalModalProps {
  children: ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  preventBodyScroll?: boolean;
  className?: string;
}

/**
 * Professional Portal-based Modal Component
 * 
 * Benefits:
 * - Renders at document root (independent of component tree)
 * - Survives parent component re-renders and navigation
 * - Prevents z-index stacking issues
 * - Industry standard approach used by major SaaS apps
 */
const PortalModal: React.FC<PortalModalProps> = ({
  children,
  isOpen,
  onClose,
  preventBodyScroll = true,
  className = '',
}) => {
  // Handle body scroll prevention
  useEffect(() => {
    if (!preventBodyScroll) return;

    if (isOpen) {
      // Store original overflow value
      const originalOverflow = document.body.style.overflow;
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Cleanup function
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, preventBodyScroll]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !onClose) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Don't render if not open
  if (!isOpen) return null;

  // Create portal at document body
  return createPortal(
    <div className={`fixed inset-0 z-[9999] ${className}`}>
      {children}
    </div>,
    document.body
  );
};

export default PortalModal;