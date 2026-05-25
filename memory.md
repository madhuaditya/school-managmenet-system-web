# Frontend Memory

Purpose: concise working log for frontend UI conventions, service mappings, and verified implementation notes.

## Entry Format
- Date: YYYY-MM-DD
- Task: short summary
- Files: touched frontend files
- Notes: key decisions, endpoints used, UI state conventions, or follow-up risks

## Baseline
- Date: 2026-05-23
- Task: initialized frontend memory file for project tracking.
- Files: memory.md
- Notes: keep entries brief; log any menu, component, or API mapping changes after completion.

## 2026-05-23
- Task: added the shared role-management page and converted school-role list screens to CRUD-driven wrappers.
- Files: src/components/dashboard-menus/_shared/RoleManagementPage.jsx, src/components/dashboard-menus/students/StudentsListNew.jsx, src/components/dashboard-menus/admin/AdminListNew.jsx, src/components/dashboard-menus/teachers/TeachersListNew.jsx, src/components/dashboard-menus/staff/StaffListNew.jsx, src/services/dashboard-services/schoolManagementService.js
- Notes: the new UI shows inactive records, supports edit/password/details flows, and uses the backend school-management endpoints for update, restore, and delete actions; frontend build passed with Vite.