import React from 'react';
import RoleManagementPage from '../_shared/RoleManagementPage';

const TeachersListSchool = ({ searchQuery = '' }) => {
  return <RoleManagementPage role="teacher" searchQuery={searchQuery} />;
};

export default TeachersListSchool;
