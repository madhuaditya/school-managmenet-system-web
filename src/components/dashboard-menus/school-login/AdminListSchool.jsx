import React from 'react';
import RoleManagementPage from '../_shared/RoleManagementPage';

const AdminListSchool = ({ searchQuery = '' }) => {
  return <RoleManagementPage role="admin" searchQuery={searchQuery} />;
};

export default AdminListSchool;
