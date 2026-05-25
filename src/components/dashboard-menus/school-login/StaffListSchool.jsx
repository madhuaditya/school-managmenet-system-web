import React from 'react';
import RoleManagementPage from '../_shared/RoleManagementPage';

const StaffListSchool = ({ searchQuery = '' }) => {
  return <RoleManagementPage role="staff" searchQuery={searchQuery} />;
};

export default StaffListSchool;
