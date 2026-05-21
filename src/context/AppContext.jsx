import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import API_BASE from '../config';
import { monthsList, getMonthsForYear } from '../utils/dateUtils';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('isAdmin') === 'true';
  });
  const [members, setMembers] = useState([]);
  const [ledger, setLedger] = useState({});
  const [loading, setLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [expenses, setExpenses] = useState([]);
  const [templeFunds, setTempleFunds] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/data`)
      .then(res => res.json())
      .then(data => {
        if (data.members && data.ledger) {
          setMembers(data.members);
          setLedger(data.ledger);
          setExpenses(data.expenses || []);
          setTempleFunds(data.templeFunds || []);
          const years = data.availableYears || [new Date().getFullYear()];
          setAvailableYears(years);
          // Default to the current calendar year if present, otherwise the latest year
          const calYear = new Date().getFullYear();
          setCurrentYear(years.includes(calYear) ? calYear : years[years.length - 1]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setLoading(false);
      });
  }, []);

  const login = (password) => {
    if (password === 'Shubham@6682') {
      setIsAdmin(true);
      localStorage.setItem('isAdmin', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem('isAdmin');
  };

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

  // ── Display months for current year ─────────────────────────────────────
  const displayMonths = useMemo(() => getMonthsForYear(currentYear), [currentYear]);

  // ── Derived metrics (scoped to currentYear) ───────────────────────────────
  const metrics = useMemo(() => {
    // Active months for the selected year (April–Dec for 2026, Jan–Dec otherwise)
    const activeMonths = getMonthsForYear(currentYear);
    const activeMonthIndices = new Set(activeMonths.map(m => m.index));

    let totalGoal = 0;
    let collectedSoFar = 0;
    const memberContributions = {};

    members.forEach(m => {
      memberContributions[m.id] = { name: m.name, value: 0 };
    });

    // Total Goal = ₹100/member/active-month + flat ₹250 birthday bonus per member per year
    // Birthday bonus is always ₹250 per person regardless of which month their birthday falls in
    totalGoal = (members.length * activeMonths.length * 100) + (members.length * 250);

    // Collected So Far = sum of paid entries in active months only
    Object.keys(ledger).forEach(key => {
      const parts = key.split('_');
      const yearPart = parseInt(parts[0], 10);
      if (yearPart !== currentYear) return;

      const monthIndex = parseInt(parts[2], 10);
      if (!activeMonthIndices.has(monthIndex)) return; // skip inactive months

      const memberId = parts[1];
      const entry = ledger[key];
      if (entry.status === 'Paid') {
        const paid = entry.base + Number(entry.birthday);
        collectedSoFar += paid;
        if (memberContributions[memberId]) {
          memberContributions[memberId].value += paid;
        }
      }
    });

    const percentAchieved = totalGoal > 0 ? (collectedSoFar / totalGoal) * 100 : 0;
    const pieChartData = Object.values(memberContributions).filter(m => m.value > 0);

    // Temple Fund Total for the current year
    const totalTempleFund = templeFunds
      .filter(tf => tf.year === currentYear)
      .reduce((sum, tf) => sum + tf.amount, 0);

    // Total Expenses for the current year
    const totalExpenses = expenses
      .filter(e => e.year === currentYear)
      .reduce((sum, e) => sum + e.amount, 0);

    const availableAmount = collectedSoFar - totalExpenses + totalTempleFund;

    return { totalGoal, collectedSoFar, percentAchieved, pieChartData, totalTempleFund, totalExpenses, availableAmount };
  }, [ledger, members, currentYear, templeFunds, expenses]);

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
      displayMonths,
      addMember, editMember, deleteMember,
      expenses: currentYearExpenses, addExpense, deleteExpense,
      templeFunds: (templeFunds || []).filter(tf => tf.year === currentYear),
      addTempleFund: async ({ memberId, memberName, amount, date }) => {
        try {
          const targetYear = currentYear || new Date().getFullYear();
          const payload = { memberId, memberName, amount, date, year: targetYear };
          console.log('Sending Temple Fund payload:', payload);
          const res = await fetch(`${API_BASE}/api/temple-funds`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.success) {
            setTempleFunds(prev => [...prev, data.fund]);
          } else {
            console.error('Server rejected temple fund:', data.error);
          }
        } catch (err) {
          console.error('Failed to add temple fund (fetch error):', err);
        }
      },
      editTempleFund: async (id, payload) => {
        try {
          const res = await fetch(`${API_BASE}/api/temple-funds/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.success) {
            setTempleFunds(prev => prev.map(tf => tf.id === id ? data.fund : tf));
          }
        } catch (err) {
          console.error('Failed to edit temple fund:', err);
        }
      },
      deleteTempleFund: async (id) => {
        try {
          const res = await fetch(`${API_BASE}/api/temple-funds/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            setTempleFunds(prev => prev.filter(tf => tf.id !== id));
          }
        } catch (err) {
          console.error('Failed to delete temple fund:', err);
        }
      },
      metrics, loading
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
