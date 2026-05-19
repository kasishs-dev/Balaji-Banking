import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import API_BASE from '../config';

const AppContext = createContext();

export const monthsList = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const AppProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [members, setMembers] = useState([]);
  const [ledger, setLedger] = useState({});
  const [loading, setLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/data`)
      .then(res => res.json())
      .then(data => {
        if (data.members && data.ledger) {
          setMembers(data.members);
          setLedger(data.ledger);
          setExpenses(data.expenses || []);
          const years = data.availableYears || [new Date().getFullYear()];
          setAvailableYears(years);
          // Default to the latest year
          setCurrentYear(years[years.length - 1]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setLoading(false);
      });
  }, []);

  const login = (password) => {
    if (password === 'admin123') { setIsAdmin(true); return true; }
    return false;
  };

  const logout = () => setIsAdmin(false);

  // ── Ledger update ─────────────────────────────────────────────────────────
  const updateLedger = async (memberId, monthIndex, field, value) => {
    const key = `${currentYear}_${memberId}_${monthIndex}`;
    setLedger(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));

    try {
      await fetch(`${API_BASE}/api/ledger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: currentYear, memberId, monthIndex, field, value })
      });
    } catch (error) {
      console.error('Failed to update ledger on server:', error);
    }
  };

  // ── Add a new year ────────────────────────────────────────────────────────
  const addYear = async (year) => {
    try {
      const res = await fetch(`${API_BASE}/api/years`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year })
      });
      const data = await res.json();
      if (data.success) {
        setAvailableYears(data.availableYears);
        // Also refresh full ledger since new keys were added
        const fullData = await fetch(`${API_BASE}/api/data`).then(r => r.json());
        setLedger(fullData.ledger);
        setCurrentYear(year);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (error) {
      console.error('Failed to add year:', error);
      return { success: false, error: 'Network error' };
    }
  };

  // ── Member CRUD ───────────────────────────────────────────────────────────
  const addMember = async (name, mobile) => {
    try {
      const res = await fetch(`${API_BASE}/api/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile })
      });
      const data = await res.json();
      if (data.success) {
        setMembers(prev => [...prev, data.member]);
        setLedger(data.ledger);
      }
    } catch (error) {
      console.error('Failed to add member:', error);
    }
  };

  const editMember = async (id, name, mobile) => {
    try {
      const res = await fetch(`${API_BASE}/api/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile })
      });
      const data = await res.json();
      if (data.success) {
        setMembers(prev => prev.map(m => String(m.id) === String(id) ? data.member : m));
      }
    } catch (error) {
      console.error('Failed to edit member:', error);
    }
  };

  const deleteMember = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/members/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMembers(prev => prev.filter(m => String(m.id) !== String(id)));
        setLedger(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(key => {
            // key: year_memberId_monthIndex
            const parts = key.split('_');
            if (parts[1] === String(id)) delete updated[key];
          });
          return updated;
        });
      }
    } catch (error) {
      console.error('Failed to delete member:', error);
    }
  };

  // ── Derived metrics (scoped to currentYear) ───────────────────────────────
  const metrics = useMemo(() => {
    let totalGoal = 0;
    let collectedSoFar = 0;
    const memberContributions = {};

    members.forEach(m => {
      memberContributions[m.id] = { name: m.name, value: 0 };
    });

    // Only consider ledger keys for the currentYear
    Object.keys(ledger).forEach(key => {
      const parts = key.split('_');
      const yearPart = parseInt(parts[0], 10);
      if (yearPart !== currentYear) return;

      const memberId = parts[1];
      const entry = ledger[key];
      const entryTotal = entry.base + Number(entry.birthday);
      totalGoal += entryTotal;

      if (entry.status === 'Paid') {
        collectedSoFar += entryTotal;
        if (memberContributions[memberId]) {
          memberContributions[memberId].value += entryTotal;
        }
      }
    });

    const percentAchieved = totalGoal > 0 ? (collectedSoFar / totalGoal) * 100 : 0;
    const pieChartData = Object.values(memberContributions).filter(m => m.value > 0);

    return { totalGoal, collectedSoFar, percentAchieved, pieChartData };
  }, [ledger, members, currentYear]);

  // ── Expenses ──────────────────────────────────────────────────────────────
  const currentYearExpenses = useMemo(
    () => expenses.filter(e => e.year === currentYear),
    [expenses, currentYear]
  );

  const addExpense = async ({ name, amount, date }) => {
    try {
      const res = await fetch(`${API_BASE}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, amount, date, year: currentYear })
      });
      const data = await res.json();
      if (data.success) setExpenses(prev => [...prev, data.expense]);
    } catch (err) {
      console.error('Failed to add expense:', err);
    }
  };

  const deleteExpense = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/expenses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

  return (
    <AppContext.Provider value={{
      isAdmin, login, logout,
      members, monthsList,
      ledger, updateLedger,
      availableYears, currentYear, setCurrentYear, addYear,
      addMember, editMember, deleteMember,
      expenses: currentYearExpenses, addExpense, deleteExpense,
      metrics, loading
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
