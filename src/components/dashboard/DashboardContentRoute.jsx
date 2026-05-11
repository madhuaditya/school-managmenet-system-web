import { useOutletContext } from 'react-router-dom';
import ContentArea from './ContentArea';

const DashboardContentRoute = () => {
  const {
    activeMenu,
    setActiveMenu,
    targetId,
    setTargetId,
    searchQuery,
    selectedProfileId,
    selectedProfile,
    clearSelectedProfile,
  } = useOutletContext();

  return (
    <ContentArea
      activeMenu={activeMenu}
      setActiveMenu={setActiveMenu}
      targetId={targetId}
      setTargetId={setTargetId}
      searchQuery={searchQuery}
      selectedProfileId={selectedProfileId}
      selectedProfile={selectedProfile}
      clearSelectedProfile={clearSelectedProfile}
    />
  );
};

export default DashboardContentRoute;
