import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

import Sidebar from './components/sidebar';
import Swap from './pages/swap';

function App() {
  return (
    <div className="layout">
      <Sidebar />
      <Box component="main" className="container">
        <Routes>
          <Route path="/swap" element={<Swap />} />
          <Route path="*" element={<Navigate replace to="/swap" />} />
        </Routes>
      </Box>
    </div>
  );
}

export default App;
