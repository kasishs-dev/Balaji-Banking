import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MonthView from './pages/MonthView';
import Login from './pages/Login';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="month/:monthId" element={<MonthView />} />
        <Route path="login" element={<Login />} />
      </Route>
    </Routes>
  );
}

export default App;
