import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Select, MenuItem, Chip, Button } from '@mui/material';
import { useAppContext } from '../context/AppContext';
import { monthsList } from '../utils/dateUtils';
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import { exportMonthlyLedger, parseLedgerExcel } from "../utils/excelUtils";

const MonthView = () => {
  const { monthId } = useParams();
  const monthIndex = parseInt(monthId, 10);
  const monthName = monthsList[monthIndex];
  
  const { members, ledger, updateLedger, isAdmin, currentYear, bulkUpdateLedger } = useAppContext();

  if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return <Typography>Invalid Month</Typography>;
  }

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const updates = await parseLedgerExcel(file);
      const res = await bulkUpdateLedger(updates);
      if (res.success) {
        alert("Data imported successfully!");
      } else {
        alert("Failed to import data: " + res.error);
      }
    } catch (err) {
      console.error("Import error:", err);
      alert("Error reading Excel file. Please ensure it follows the template format.");
    }
  };

  const handleBirthdayChange = (memberId, value) => {
    const numValue = value === '' ? 0 : Number(value);
    if (!isNaN(numValue)) {
      updateLedger(memberId, monthIndex, 'birthday', numValue);
    }
  };

  const handleBaseChange = (memberId, value) => {
    const numValue = value === '' ? 0 : Number(value);
    if (!isNaN(numValue)) {
      updateLedger(memberId, monthIndex, 'base', numValue);
    }
  };

  const handleStatusChange = (memberId, value) => {
    updateLedger(memberId, monthIndex, 'status', value);
    // Auto-set today's date when marking as Paid, clear when reverting to Pending
    if (value === 'Paid') {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      updateLedger(memberId, monthIndex, 'paidDate', today);
    } else {
      updateLedger(memberId, monthIndex, 'paidDate', null);
    }
  };

  const handleDateChange = (memberId, value) => {
    updateLedger(memberId, monthIndex, 'paidDate', value || null);
  };

  const handleSourceChange = (memberId, value) => {
    updateLedger(memberId, monthIndex, 'source', value);
  };

  const currentMonth = { name: monthName, index: monthIndex };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700 }}>
            {monthName} Collection
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Detailed view of contributions for {monthName} {currentYear}.
          </Typography>
        </Box>
        {isAdmin && (
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<FileDownloadIcon />}
              onClick={() => exportMonthlyLedger(currentYear, currentMonth, members, ledger)}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Export Month
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              component="label"
              startIcon={<FileUploadIcon />}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Import Month
              <input
                type="file"
                hidden
                accept=".xlsx, .xls"
                onChange={handleImportExcel}
              />
            </Button>
          </Box>
        )}
      </Box>

      <Card sx={{ overflow: 'hidden' }}>
        <CardContent sx={{ p: '0 !important' }}>
          {/* Desktop Table View */}
          <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
            <Table sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Member Name</TableCell>
                  <TableCell align="right">Base Collection</TableCell>
                  <TableCell align="right">Birthday Collection</TableCell>
                  <TableCell align="right">Total Contribution</TableCell>
                  <TableCell align="center">Payment Date</TableCell>
                  <TableCell align="center">Payment Source</TableCell>
                  <TableCell align="center">Payment Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((member, idx) => {
                  const entry = ledger[`${currentYear}_${member.id}_${monthIndex}`];
                  const total = entry.base + Number(entry.birthday);
                  const isPaid = entry.status === 'Paid';
                  
                  return (
                    <TableRow 
                      key={member.id} 
                      hover
                      sx={{ 
                        backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(248, 250, 252, 0.5)',
                        transition: 'background-color 0.2s',
                        '&:hover': { backgroundColor: 'rgba(226, 232, 240, 0.5) !important' }
                      }}
                    >
                      <TableCell component="th" scope="row" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {member.name}
                      </TableCell>
                      <TableCell align="right">
                        {isAdmin ? (
                          <TextField
                            size="small"
                            type="number"
                            value={entry.base}
                            onChange={(e) => handleBaseChange(member.id, e.target.value)}
                            sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            inputProps={{ min: 0, step: 100 }}
                          />
                        ) : (
                          <Typography sx={{ fontWeight: 500 }}>₹{entry.base}</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {isAdmin ? (
                          <TextField
                            size="small"
                            type="number"
                            value={entry.birthday}
                            onChange={(e) => handleBirthdayChange(member.id, e.target.value)}
                            sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            inputProps={{ min: 0, step: 100 }}
                          />
                        ) : (
                          <Typography sx={{ fontWeight: 500 }}>₹{entry.birthday}</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '1.05rem' }}>
                        ₹{total}
                      </TableCell>
                      {/* Payment Date */}
                      <TableCell align="center">
                        {isAdmin ? (
                          <TextField
                            size="small"
                            type="date"
                            value={entry.paidDate || ''}
                            onChange={(e) => handleDateChange(member.id, e.target.value)}
                            sx={{ width: 150, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            InputLabelProps={{ shrink: true }}
                          />
                        ) : (
                          <Typography variant="body2" sx={{ fontWeight: 500, color: entry.paidDate ? 'text.primary' : 'text.disabled' }}>
                            {entry.paidDate
                              ? new Date(entry.paidDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '—'}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {isAdmin ? (
                          <Select
                            size="small"
                            value={entry.source || 'Cash'}
                            onChange={(e) => handleSourceChange(member.id, e.target.value)}
                            sx={{ minWidth: 120, borderRadius: 2, '& .MuiSelect-select': { py: 0.75 } }}
                          >
                            <MenuItem value="Cash">Cash</MenuItem>
                            <MenuItem value="UPI">UPI</MenuItem>
                            <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                          </Select>
                        ) : (
                          <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                            {entry.source || 'Cash'}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {isAdmin ? (
                          <Select
                            size="small"
                            value={entry.status}
                            onChange={(e) => handleStatusChange(member.id, e.target.value)}
                            sx={{ 
                              minWidth: 120,
                              borderRadius: 2,
                              backgroundColor: isPaid ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 23, 68, 0.1)',
                              color: isPaid ? 'success.main' : 'error.main',
                              fontWeight: 600,
                              '& .MuiSelect-select': { py: 0.75 },
                              '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
                            }}
                          >
                            <MenuItem value="Pending">Pending</MenuItem>
                            <MenuItem value="Paid">Paid</MenuItem>
                          </Select>
                        ) : (
                          <Chip 
                            label={entry.status} 
                            size="small"
                            sx={{ 
                              fontWeight: 700, 
                              minWidth: 80,
                              backgroundColor: isPaid ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 23, 68, 0.15)',
                              color: isPaid ? 'success.main' : 'error.main',
                              border: 'none',
                              borderRadius: '6px'
                            }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Mobile Card List View */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, p: 2 }}>
            {members.map((member) => {
              const entry = ledger[`${currentYear}_${member.id}_${monthIndex}`] || { base: 100, birthday: 0, status: 'Pending', source: 'Cash', paidDate: null };
              const total = entry.base + Number(entry.birthday);
              const isPaid = entry.status === 'Paid';

              return (
                <Card key={member.id} sx={{ mb: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3 }}>
                  <CardContent sx={{ p: 2 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {member.name}
                      </Typography>
                      {isAdmin ? (
                        <Select
                          size="small"
                          value={entry.status}
                          onChange={(e) => handleStatusChange(member.id, e.target.value)}
                          sx={{ 
                            minWidth: 100,
                            borderRadius: 2,
                            backgroundColor: isPaid ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 23, 68, 0.1)',
                            color: isPaid ? 'success.main' : 'error.main',
                            fontWeight: 600,
                            '& .MuiSelect-select': { py: 0.5, px: 1 },
                            '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
                          }}
                        >
                          <MenuItem value="Pending">Pending</MenuItem>
                          <MenuItem value="Paid">Paid</MenuItem>
                        </Select>
                      ) : (
                        <Chip 
                          label={entry.status} 
                          size="small"
                          sx={{ 
                            fontWeight: 700, 
                            minWidth: 80,
                            backgroundColor: isPaid ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 23, 68, 0.15)',
                            color: isPaid ? 'success.main' : 'error.main',
                            border: 'none',
                            borderRadius: '6px'
                          }}
                        />
                      )}
                    </Box>

                    {/* Info Fields */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Base Collection</Typography>
                        {isAdmin ? (
                          <TextField
                            size="small"
                            type="number"
                            value={entry.base}
                            onChange={(e) => handleBaseChange(member.id, e.target.value)}
                            sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            inputProps={{ min: 0, step: 100 }}
                          />
                        ) : (
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{entry.base}</Typography>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Birthday Collection</Typography>
                        {isAdmin ? (
                          <TextField
                            size="small"
                            type="number"
                            value={entry.birthday}
                            onChange={(e) => handleBirthdayChange(member.id, e.target.value)}
                            sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            inputProps={{ min: 0, step: 100 }}
                          />
                        ) : (
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{entry.birthday}</Typography>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed', borderColor: 'divider', pt: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>Total Contribution</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>₹{total}</Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Payment Source</Typography>
                        {isAdmin ? (
                          <Select
                            size="small"
                            value={entry.source || 'Cash'}
                            onChange={(e) => handleSourceChange(member.id, e.target.value)}
                            sx={{ minWidth: 120, borderRadius: 2, '& .MuiSelect-select': { py: 0.5 } }}
                          >
                            <MenuItem value="Cash">Cash</MenuItem>
                            <MenuItem value="UPI">UPI</MenuItem>
                            <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                          </Select>
                        ) : (
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                            {entry.source || 'Cash'}
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Payment Date</Typography>
                        {isAdmin ? (
                          <TextField
                            size="small"
                            type="date"
                            value={entry.paidDate || ''}
                            onChange={(e) => handleDateChange(member.id, e.target.value)}
                            sx={{ width: 150, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            InputLabelProps={{ shrink: true }}
                          />
                        ) : (
                          <Typography variant="body2" sx={{ fontWeight: 600, color: entry.paidDate ? 'text.primary' : 'text.disabled' }}>
                            {entry.paidDate
                              ? new Date(entry.paidDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '—'}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MonthView;
