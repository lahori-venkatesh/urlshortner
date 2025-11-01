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

  // Upgrade Modal Actions
  const openUpgradeModal = (
    feature: string = 'Premium Features',
    message: string = 'This feature requires a Pro subscription.',
    businessOnly: boolean = false
  ) => {
    console.log('🎯 ModalContext: Opening upgrade modal', { feature, message, businessOnly });
    setUpgradeFeature(feature);
    setUpgradeMessage(message);
    setShowOnlyBusiness(businessOnly);
    setIsUpgradeModalOpen(true);
    setActiveModal('upgrade');
  };

  const closeUpgradeModal = () => {
    console.log('🎯 ModalContext: Closing upgrade modal');
    setIsUpgradeModalOpen(false);
    setUpgradeFeature('');
    setUpgradeMessage('');
    setShowOnlyBusiness(false);
    setActiveModal(null);
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