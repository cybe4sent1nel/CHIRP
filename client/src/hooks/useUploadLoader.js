import { useDispatch, useSelector } from 'react-redux';
import { setUploadLoading } from '../features/ui/uiSlice';

const useUploadLoader = () => {
  const dispatch = useDispatch();
  const isUploading = useSelector((state) => state.ui?.isUploading || false);

  const showUploadLoader = () => {
    dispatch(setUploadLoading(true));
  };

  const hideUploadLoader = () => {
    dispatch(setUploadLoading(false));
  };

  return {
    isUploading,
    showUploadLoader,
    hideUploadLoader
  };
};

export default useUploadLoader;
