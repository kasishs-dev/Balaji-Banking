import * as XLSX from 'xlsx';

/**
 * Generates an Excel template for a SPECIFIC month of a given year.
 */
export const exportMonthlyLedger = (year, month, members, ledger) => {
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
      'Payment Date': entry.paidDate || '',
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

    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, ws, `Year ${year}`);
    
    // Set column widths
    ws['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 15 }];
  });

  XLSX.writeFile(workbook, `Balaji_Banking_Full_Report.xlsx`);
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
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const updates = jsonData.map(row => {
          const status = String(row['Status'] || 'Pending');
          let paidDate = row['Payment Date'] || null;

          // Auto-set today's date if status is Paid but date is missing
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
