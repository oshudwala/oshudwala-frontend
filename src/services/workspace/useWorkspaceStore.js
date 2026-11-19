import { useState, useEffect } from 'react';
import workspaceStore from './workspaceStore';

export const useWorkspaceStore = () => {
  const [storeState, setStoreState] = useState(() => workspaceStore.getState());

  useEffect(() => {
    const unsubscribe = workspaceStore.subscribe((newState) => {
      setStoreState(newState);
    });
    return unsubscribe;
  }, []);

  return {
    ...storeState,
    updateOrderStatus: workspaceStore.updateOrderStatus.bind(workspaceStore),
    assignRider: workspaceStore.assignRider.bind(workspaceStore),
    verifyPickup: workspaceStore.verifyPickup.bind(workspaceStore),
    completeDelivery: workspaceStore.completeDelivery.bind(workspaceStore),
    generateToken: workspaceStore.generateToken.bind(workspaceStore),
    callNextToken: workspaceStore.callNextToken.bind(workspaceStore),
    skipToken: workspaceStore.skipToken.bind(workspaceStore),
    recallToken: workspaceStore.recallToken.bind(workspaceStore),
    completeConsultation: workspaceStore.completeConsultation.bind(workspaceStore),
    verifyPrescription: workspaceStore.verifyPrescription.bind(workspaceStore),
    rejectPrescription: workspaceStore.rejectPrescription.bind(workspaceStore),
    adjustStock: workspaceStore.adjustStock.bind(workspaceStore),
    toggleRiderOnline: workspaceStore.toggleRiderOnline.bind(workspaceStore),
    reconcileCash: workspaceStore.reconcileCash.bind(workspaceStore),
    resetDefaults: workspaceStore.resetDefaults.bind(workspaceStore),
  };
};

export default useWorkspaceStore;
