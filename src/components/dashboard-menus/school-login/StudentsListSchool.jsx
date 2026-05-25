import React from 'react';
import RoleManagementPage from '../_shared/RoleManagementPage';

const StudentsListSchool = ({ searchQuery = '' }) => {
  return <RoleManagementPage role="student" searchQuery={searchQuery} />;
};

export default StudentsListSchool;
