import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { UserPage } from './pages/UserPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { ProtocolsPage } from './pages/ProtocolsPage';

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <Routes>
        <Route path="/" element={<UserPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/protocols" element={<ProtocolsPage />} />
      </Routes>
    </div>
  );
}