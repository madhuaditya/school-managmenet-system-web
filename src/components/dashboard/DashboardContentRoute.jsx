import { useOutletContext } from 'react-router-dom';
import ContentArea from './ContentArea';

const DashboardContentRoute = () => {
  const { activeMenu, setActiveMenu, targetId, setTargetId } = useOutletContext();

  return (
    <ContentArea
      activeMenu={activeMenu}
      setActiveMenu={setActiveMenu}
      targetId={targetId}
      setTargetId={setTargetId}
    />
  );
};

export default DashboardContentRoute;
