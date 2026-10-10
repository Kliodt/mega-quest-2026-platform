import { type ReactNode } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { AdminAuthProvider } from './admin/AdminAuthContext.js';
import { AdminLayout } from './admin/AdminLayout.js';
import { AdminBindingsPage } from './admin/pages/AdminBindingsPage.js';
import { AdminCellsPage } from './admin/pages/AdminCellsPage.js';
import { AdminLoginPage } from './admin/pages/AdminLoginPage.js';
import { AdminQuestionsPage } from './admin/pages/AdminQuestionsPage.js';
import { AdminRoutesPage } from './admin/pages/AdminRoutesPage.js';
import { AdminTeamPage } from './admin/pages/AdminTeamPage.js';
import { AdminTeamsPage } from './admin/pages/AdminTeamsPage.js';
import { RequireAdmin } from './admin/RequireAdmin.js';
import { QueryProvider } from './api/QueryProvider.js';
import { AuthProvider } from './auth/AuthContext.js';
import { RequireAuth } from './auth/RequireAuth.js';
import { LoginPage } from './pages/LoginPage.js';
import { LogoutPage } from './pages/LogoutPage.js';
import { MapPage } from './pages/MapPage.js';
import { PubBindingsPage } from './pages/PubBindingsPage.js';
import { PubConfirmVideoPage } from './pages/PubConfirmVideoPage.js';
import { PubMinesweeperPage } from './pages/PubMinesweeperPage.js';
import { QuestionPage } from './pages/QuestionPage.js';
import { QuestLayout } from './pages/QuestLayout.js';
import { QuestPage } from './pages/QuestPage.js';

const router = createBrowserRouter([
  {
    path: '/',
    Component: Outlet,
    children: [
      { path: 'login', Component: LoginPage },
      { path: 'logout', Component: LogoutPage },
      // Открытая страница организаторов: проверить, что за код наклеен на дверь
      { path: 'pub/bindings', Component: PubBindingsPage },
      // Открытая страница организаторов: проверить, что за клетка сапёра за меткой
      { path: 'pub/minesweeper', Component: PubMinesweeperPage },
      // Ссылка из ролика соцсетей: открыл с устройства команды — задание засчитано
      { path: 'pub/confirm_video', Component: PubConfirmVideoPage },
      {
        Component: RequireAuth,
        children: [
          {
            Component: QuestLayout,
            children: [
              { index: true, Component: QuestPage },
              { path: 'question', Component: QuestionPage },
              // Игры вроде истории прячут номер следующей аудитории в адресе страницы
              { path: 'question/:slug', Component: QuestionPage },
              { path: 'map', Component: MapPage },
            ],
          },
        ],
      },
      {
        path: 'admin',
        children: [
          { path: 'login', Component: AdminLoginPage },
          {
            Component: RequireAdmin,
            children: [
              {
                Component: AdminLayout,
                children: [
                  { index: true, element: <Navigate to="/admin/teams" replace /> },
                  { path: 'teams', Component: AdminTeamsPage },
                  { path: 'teams/:id', Component: AdminTeamPage },
                  { path: 'routes', Component: AdminRoutesPage },
                  { path: 'questions', Component: AdminQuestionsPage },
                  { path: 'bindings', Component: AdminBindingsPage },
                  { path: 'cells', Component: AdminCellsPage },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);

export function App(): ReactNode {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <QueryProvider>
          <RouterProvider router={router} />
        </QueryProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
}
