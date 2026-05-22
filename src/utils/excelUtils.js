import * as XLSX from 'xlsx';

/**
 * Generates an Excel template for a SPECIFIC month of a given year.
 */
export const exportMonthlyLedger = (year, month, members, ledger) => {
  const formatDateForExcel = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${m}/${d}/${y}`;
    }
    return dateStr;
  };

  const data = members.map(member => {
    const key = `${year}_${member.id}_${month.index}`;
    const entry = ledger[key] || { base: 100, birthday: 0, status: 'Pending', source: 'Cash' };
    
    return {
      'Member ID': member.id,
      'Member Name': member.name,
      'Year': year,
      'Month Index': month.index,
      'Month': month.name,
      'Base Amount': entry.base,
      'Birthday Amount': entry.birthday,
      'Status': entry.status,
      'Source': entry.source,
      'Payment Date': formatDateForExcel(entry.paidDate),
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `${month.name}_${year}`);

  const wscols = [
    { wch: 25 }, { wch: 20 }, { wch: 8 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }
  ];
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `Balaji_Banking_${month.name}_${year}.xlsx`);
};

/**
 * Generates an Excel file with multiple sheets (one per year + Global Summary).
 * Mirrors everything seen on the Dashboard.
 */
export const exportMasterLedger = (availableYears, members, ledger, expenses, templeFunds, allTimeMetrics) => {
  const workbook = XLSX.utils.book_new();

  // 1. Global Summary Sheet
  const globalData = [
    { 'Metric': 'Total Collected (All Years)', 'Value': allTimeMetrics.allTimeCollected },
    { 'Metric': 'Total Expenses (All Years)', 'Value': allTimeMetrics.allTimeExpenses },
    { 'Metric': 'Temple Fund (All Years)', 'Value': allTimeMetrics.allTimeTempleFund },
    { 'Metric': 'Available Balance (All Years)', 'Value': allTimeMetrics.allTimeAvailable },
  ];
  const globalWS = XLSX.utils.json_to_sheet(globalData);
  XLSX.utils.book_append_sheet(workbook, globalWS, 'Global Summary');

  // 2. Year-wise Sheets
  availableYears.forEach(year => {
    const sheetData = [];

    // Filter year-specific data
    const yearExpenses = expenses.filter(e => e.year === year);
    const yearTempleFunds = templeFunds.filter(tf => tf.year === year);
    
    // Calculate year-specific metrics (Simplified but matching dashboard logic)
    // In a real app, you might want to pass pre-calculated metrics per year
    // For now we'll do a quick calculation here or assume passed data
    let yearCollected = 0;
    Object.keys(ledger).forEach(key => {
      if (key.startsWith(`${year}_`) && ledger[key].status === 'Paid') {
        yearCollected += ledger[key].base + (ledger[key].birthday || 0);
      }
    });

    const yearExpensesTotal = yearExpenses.reduce((sum, e) => sum + e.amount, 0);
    const yearTempleTotal = yearTempleFunds.reduce((sum, tf) => sum + tf.amount, 0);

    // Header: Year Summary
    sheetData.push({ 'Section': `SUMMARY FOR ${year}`, 'Field': '', 'Value': '' });
    sheetData.push({ 'Section': '', 'Field': 'Total Collected', 'Value': yearCollected });
    sheetData.push({ 'Section': '', 'Field': 'Total Expenses', 'Value': yearExpensesTotal });
    sheetData.push({ 'Section': '', 'Field': 'Temple Fund', 'Value': yearTempleTotal });
    sheetData.push({ 'Section': '', 'Field': 'Available Balance', 'Value': yearCollected - yearExpensesTotal + yearTempleTotal });
    sheetData.push({}); // Empty row separator

    // Member Summary Table
    sheetData.push({ 'Section': 'MEMBER CONTRIBUTIONS', 'Field': 'Member Name', 'Value': 'Total Paid' });
    members.forEach(m => {
      let mTotal = 0;
      // Sum all months for this member in this year
      for (let i = 0; i < 12; i++) {
        const entry = ledger[`${year}_${m.id}_${i}`];
        if (entry && entry.status === 'Paid') {
          mTotal += entry.base + (entry.birthday || 0);
        }
      }
      sheetData.push({ 'Section': '', 'Field': m.name, 'Value': mTotal });
    });
    sheetData.push({}); // Empty row separator

    // Expenses Table
    if (yearExpenses.length > 0) {
      sheetData.push({ 'Section': 'EXPENSES', 'Field': 'Description', 'Value': 'Amount' });
      yearExpenses.forEach(e => {
        sheetData.push({ 'Section': '', 'Field': e.description, 'Value': e.amount });
      });
      sheetData.push({}); // Empty row separator
    }

    // Temple Fund Table
    if (yearTempleFunds.length > 0) {
      sheetData.push({ 'Section': 'TEMPLE FUNDS', 'Field': 'Description', 'Value': 'Amount' });
      yearTempleFunds.forEach(tf => {
        sheetData.push({ 'Section': '', 'Field': tf.description || tf.memberName, 'Value': tf.amount });
      });
    }

    const formatDateForExcel = (dateStr) => {
      if (!dateStr) return '';
      const [y, m, d] = dateStr.split('-');
      return `${m}/${d}/${y}`;
    };

    // Explicitly format all dates for Dashboard-like appearance
    sheetData.forEach(row => {
      if (row['Payment Date']) {
        row['Payment Date'] = formatDateForExcel(row['Payment Date']);
      }
    });

    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, ws, `Year ${year}`);
    
    // Set column widths
    ws['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 15 }];
  });

  XLSX.writeFile(workbook, `Balaji_Banking_Full_Report.xlsx`);
};

/**
 * Robustly parses a date from Excel (handles strings, serial numbers, and Date objects).
 * Returns YYYY-MM-DD or null.
 */
const parseExcelDate = (val) => {
  if (val === undefined || val === null || val === '') return null;

  // 1. Handle Javascript Date objects
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const d = String(val.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return null;
  }

  // 2. Handle numeric input (even if it's a numeric string like "46170")
  let numVal = typeof val === 'number' ? val : parseFloat(val);
  // Check if it's a valid Excel serial number (around 40000-60000 for our dates)
  if (!isNaN(numVal) && String(val).match(/^\d+(\.\d+)?$/)) {
    const date = new Date(Math.round((numVal - 25569) * 864e5));
    if (!isNaN(date.getTime())) {
      // Use UTC to avoid timezone shifts for serial numbers
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  // 3. Handle Strings
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;

    // Pattern: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

    // Pattern: MM/DD/YYYY or DD/MM/YYYY or M/D/YYYY
    const parts = trimmed.split(/[/-]/);
    if (parts.length === 3) {
      let m, d, y;
      if (parts[2].length === 4) { // .../.../YYYY
        y = parts[2];
        // Assume MM/DD/YYYY first (most common)
        m = parts[0].padStart(2, '0');
        d = parts[1].padStart(2, '0');
      } else if (parts[0].length === 4) { // YYYY/.../...
        y = parts[0];
        m = parts[1].padStart(2, '0');
        d = parts[2].padStart(2, '0');
      }
      
      if (y && m && d) {
        const check = new Date(`${y}-${m}-${d}`);
        if (!isNaN(check.getTime())) return `${y}-${m}-${d}`;
      }
    }

    // Last resort: native parsing ONLY if it doesn't look like a single number
    if (!/^\d+$/.test(trimmed)) {
      const date = new Date(trimmed);
      if (!isNaN(date.getTime())) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }
  }

  return null;
};

/**
 * Parses an uploaded Excel file and extracts ledger updates.
 * @param {File} file - The uploaded file.
 * @returns {Promise<Array>} - Promise resolving to an array of updates.
 */
export const parseLedgerExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Use cellDates: true to let SheetJS attempt date conversion if possible
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        const updates = jsonData.map(row => {
          const status = String(row['Status'] || 'Pending');
          let rawDate = row['Payment Date'];
          let paidDate = parseExcelDate(rawDate);

          // Auto-set today's date if status is Paid but date parsing failed/was empty
          if (status === 'Paid' && !paidDate) {
            paidDate = new Date().toISOString().split('T')[0];
          }

          return {
            year: parseInt(row['Year'], 10),
            memberId: String(row['Member ID']),
            monthIndex: parseInt(row['Month Index'], 10),
            updates: {
              base: Number(row['Base Amount'] || 100),
              birthday: Number(row['Birthday Amount'] || 0),
              status: status,
              source: String(row['Source'] || 'Cash'),
              paidDate: paidDate,
            }
          };
        });

        resolve(updates);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
