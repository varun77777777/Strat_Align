import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import TeamDetail from './pages/TeamDetail';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/team/:teamId" element={<TeamDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

