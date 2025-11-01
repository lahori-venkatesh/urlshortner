import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  // Upgrade Modal State
  isUpgradeModalOpen: boolean;
  upgradeFeature: string;
  upgradeMessage: string;
  showOnlyBusiness: boolean;
  
  // Modal Actions
  openUpgradeModal: (feature?: string, message?: string, businessOnly?: boolean) => void;
  closeUpgradeModal: () => void;
  
  // Generic Modal State (for future modals)
  activeModal: string | null;
  modalProps: Record<string, any>;
  openModal: (modalType: string, props?: Record<string, any>) => void;
  closeModal: () => void;
  
  // Lifecycle hooks
  onModalClose: (callback: () => void) => void;
  removeModalCloseListener: (callback: () => void) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  // Upgrade Modal State
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('');
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const [showOnlyBusiness, setShowOnlyBusiness] = useState(false);
  
  // Generic Modal State
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalProps, setModalProps] = useState<Record<string, any>>({});
  
  // Lifecycle listeners
  const [closeListeners, setCloseListeners] = useState<(() => void)[]>([]);

  // Upgrade Modal Actions
  const openUpgradeModal = (
    feature: string = 'Premium Features',
    message: string = 'This feature requires a Pro subscription.',
    businessOnly: boolean = false
  ) => {
    console.log('🎯 ModalContext: Opening upgrade modal', { feature, message, businessOnly });
    console.log('🎯 ModalContext: Current state before open:', {
      isUpgradeModalOpen,
      upgradeFeature,
      upgradeMessage,
      showOnlyBusiness,
    });
    
    // Batch state updates to prevent multiple re-renders
    setUpgradeFeature(feature);
    setUpgradeMessage(message);
    setShowOnlyBusiness(businessOnly);
    setActiveModal('upgrade');
    
    // Open modal after state is set
    setTimeout(() => {
      console.log('🎯 ModalContext: Setting isUpgradeModalOpen to true');
      setIsUpgradeModalOpen(true);
    }, 0);
  };

  const closeUpgradeModal = () => {
    console.log('🎯 ModalContext: Closing upgrade modal');
    
    // Notify all close listeners
    closeListeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in modal close listener:', error);
      }
    });
    
    // Close modal first
    setIsUpgradeModalOpen(false);
    
    // Clean up state after animation
    setTimeout(() => {
      setUpgradeFeature('');
      setUpgradeMessage('');
      setShowOnlyBusiness(false);
      setActiveModal(null);
    }, 150); // Allow for modal close animation
  };

  // Generic Modal Actions
  const openModal = (modalType: string, props: Record<string, any> = {}) => {
    console.log('🎯 ModalContext: Opening modal', { modalType, props });
    setActiveModal(modalType);
    setModalProps(props);
    
    // Handle specific modal types
    if (modalType === 'upgrade') {
      openUpgradeModal(props.feature, props.message, props.businessOnly);
    }
  };

  const closeModal = () => {
    console.log('🎯 ModalContext: Closing active modal', { activeModal });
    setActiveModal(null);
    setModalProps({});
    
    // Close specific modals
    if (activeModal === 'upgrade') {
      closeUpgradeModal();
    }
  };

  // Lifecycle management
  const onModalClose = (callback: () => void) => {
    setCloseListeners(prev => [...prev, callback]);
  };

  const removeModalCloseListener = (callback: () => void) => {
    setCloseListeners(prev => prev.filter(listener => listener !== callback));
  };

  const value: ModalContextType = {
    // Upgrade Modal State
    isUpgradeModalOpen,
    upgradeFeature,
    upgradeMessage,
    showOnlyBusiness,
    
    // Modal Actions
    openUpgradeModal,
    closeUpgradeModal,
    
    // Generic Modal State
    activeModal,
    modalProps,
    openModal,
    closeModal,
    
    // Lifecycle hooks
    onModalClose,
    removeModalCloseListener,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

// Convenience hooks for specific modals
export const useUpgradeModal = () => {
  const { 
    isUpgradeModalOpen, 
    upgradeFeature, 
    upgradeMessage, 
    showOnlyBusiness,
    openUpgradeModal, 
    closeUpgradeModal 
  } = useModal();
  
  return {
    isOpen: isUpgradeModalOpen,
    feature: upgradeFeature,
    message: upgradeMessage,
    showOnlyBusiness,
    open: openUpgradeModal,
    close: closeUpgradeModal,
  };
};