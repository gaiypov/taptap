// Re-export from lib/store/slices/authSheetSlice.ts for backward compatibility
export { selectIsAuthSheetOpen, selectAuthSheetAction } from '@/lib/store/slices/authSheetSlice';
import { useSelector, useDispatch } from 'react-redux';
import { open, close, selectIsAuthSheetOpen, selectAuthSheetAction } from '@/lib/store/slices/authSheetSlice';
import type { AuthAction } from '@/utils/permissionManager';

// Hook for easy access
export const useAuthSheetStore = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsAuthSheetOpen);
  const action = useSelector(selectAuthSheetAction);
  
  return {
    isOpen,
    action,
    open: (action: AuthAction) => dispatch(open(action)),
    close: () => dispatch(close()),
  };
};

