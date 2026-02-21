import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MoleculeSearch from './pages/MoleculeSearch';
import AccountSearch from './pages/AccountSearch';
import ProjectSearch from './pages/ProjectSearch';
import EmailPlanner from './pages/EmailPlanner';
import DataImport from './pages/DataImport';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="molecules" element={<MoleculeSearch />} />
          <Route path="accounts" element={<AccountSearch />} />
          <Route path="projects" element={<ProjectSearch />} />
          <Route path="emails" element={<EmailPlanner />} />
          <Route path="import" element={<DataImport />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
