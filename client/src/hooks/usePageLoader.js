import { useDispatch, useSelector } from 'react-redux';
import { setLoading } from '../features/ui/uiSlice';

const usePageLoader = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.ui?.isLoading || false);

  const showLoader = () => {
    dispatch(setLoading(true));
  };

  const hideLoader = () => {
    dispatch(setLoading(false));
  };

  return {
    isLoading,
    showLoader,
    hideLoader
  };
};

export default usePageLoader;
