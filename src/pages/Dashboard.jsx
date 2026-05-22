import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  IconButton,
  Chip,
  Avatar,
  MenuItem,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { useAppContext } from "../context/AppContext";
import ManageMembersDialog from "../components/ManageMembersDialog";
import DeleteIcon from "@mui/icons-material/Delete";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AddIcon from "@mui/icons-material/Add";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SavingsIcon from "@mui/icons-material/Savings";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ChurchIcon from "@mui/icons-material/Church"; // Using Church as a fallback for Temple if needed, or stick to AccountBalance
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import { exportMasterLedger, parseLedgerExcel } from "../utils/excelUtils";

// Modern Palette for the Pie Chart
const COLORS = [
  "#E65100",
  "#EF6C00",
  "#F57C00",
  "#FB8C00",
  "#FF9800",
  "#FFA726",
  "#FFB74D",
  "#FFCC80",
  "#FFE0B2",
  "#FFF3E0",
];

const SummaryCard = ({ title, value, icon, gradient, delay }) => (
  <Card
    sx={{
      flex: 1,
      minWidth: 200,
      background: gradient,
      color: "#fff",
      border: "none",
      borderRadius: 3,
      boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
      animation: `fadeInUp 0.5s ease-out ${delay}s both`,
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
      },
      "@keyframes fadeInUp": {
        "0%": { opacity: 0, transform: "translateY(20px)" },
        "100%": { opacity: 1, transform: "translateY(0)" },
      },
    }}
  >
    <CardContent
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: "20px !important",
      }}
    >
      <Box
        sx={{
          backgroundColor: "rgba(255,255,255,0.2)",
          borderRadius: "50%",
          p: 1.5,
          display: "flex",
        }}
      >
        {React.cloneElement(icon, { sx: { fontSize: 28 } })}
      </Box>
      <Box>
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 600,
            textTransform: "uppercase",
            opacity: 0.9,
          }}
        >
          {title}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
          ₹{value.toLocaleString()}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const {
    members,
    ledger,
    metrics,
    isAdmin,
    currentYear,
    displayMonths,
    expenses,
    addExpense,
    deleteExpense,
    templeFunds,
    addTempleFund,
    deleteTempleFund,
    bulkUpdateLedger,
    availableYears,
    allExpenses,
    allTempleFunds,
  } = useAppContext();
  const [manageOpen, setManageOpen] = useState(false);

  // Expense Form State
  const [expName, setExpName] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Temple Fund Form State
  const [tfMemberName, setTfMemberName] = useState("");
  const [tfAmount, setTfAmount] = useState("");
  const [tfDate, setTfDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const totalExpenses = metrics.totalExpenses;
  const totalTempleFund = metrics.totalTempleFund;
  const availableBalance = metrics.availableAmount;

  const getMemberGrandTotal = (memberId) => {
    let total = 0;
    displayMonths.forEach(({ index: monthIndex }) => {
      const entry = ledger[`${currentYear}_${memberId}_${monthIndex}`];
      if (entry && entry.status === "Paid") {
        total += entry.base + Number(entry.birthday);
      }
    });
    return total;
  };

  const getMemberProgress = (memberId) => {
    let paidMonths = 0;
    displayMonths.forEach(({ index: monthIndex }) => {
      const entry = ledger[`${currentYear}_${memberId}_${monthIndex}`];
      if (entry && entry.status === "Paid") paidMonths++;
    });
    return (paidMonths / displayMonths.length) * 100;
  };



  return (
    <Box sx={{ pb: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 4,
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              color: "primary.main",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Overview of the bank's financial health.{" "}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {isAdmin && (
            <>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<FileDownloadIcon />}
                onClick={() => exportMasterLedger(availableYears, members, ledger, allExpenses, allTempleFunds, metrics)}
                sx={{
                  fontWeight: 700,
                  borderRadius: 2,
                }}
              >
                Export All Data
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setManageOpen(true)}
                sx={{
                  color: "primary.dark",
                  whiteSpace: "nowrap",
                  fontWeight: 700,
                  borderRadius: 2,
                }}
              >
                Manage Members
              </Button>
            </>
          )}
        </Box>
      </Box>

      <ManageMembersDialog
        open={manageOpen}
        onClose={() => setManageOpen(false)}
      />

      {/* ── 1. Summary Cards ───────────────────────────────────────────── */}
      <Box sx={{ display: "flex", gap: 3, mb: 4, flexWrap: "wrap" }}>
        <SummaryCard
          title="Total Goal"
          value={metrics.totalGoal}
          icon={<AccountBalanceIcon />}
          gradient="linear-gradient(135deg, #1E293B 0%, #0F172A 100%)"
          delay={0}
        />
        <SummaryCard
          title="Collected till date"
          value={metrics.collectedSoFar}
          icon={<TrendingUpIcon />}
          gradient="linear-gradient(135deg, #FF9800 0%, #F57C00 100%)"
          delay={0.1}
        />
        <SummaryCard
          title="Total Expenses"
          value={totalExpenses}
          icon={<ReceiptLongIcon />}
          gradient="linear-gradient(135deg, #FF1744 0%, #B71C1C 100%)"
          delay={0.2}
        />
        <SummaryCard
          title="Temple Fund"
          value={totalTempleFund}
          icon={<AccountBalanceIcon />}
          gradient="linear-gradient(135deg, #00B8D4 0%, #00838F 100%)"
          delay={0.3}
        />
        <SummaryCard
          title="Available Balance"
          value={availableBalance}
          icon={<SavingsIcon />}
          gradient="linear-gradient(135deg, #00E676 0%, #00C853 100%)"
          delay={0.4}
        />
        <SummaryCard
          title="Collected (All Years)"
          value={metrics.allTimeCollected}
          icon={<TrendingUpIcon />}
          gradient="linear-gradient(135deg, #FF9800 0%, #E65100 100%)"
          delay={0.5}
        />
        <SummaryCard
          title="Available (All Years)"
          value={metrics.allTimeAvailable}
          icon={<AccountBalanceWalletIcon />}
          gradient="linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)"
          delay={0.6}
        />
      </Box>

      {/* ── 2. Middle Section: Chart & Expenses ─────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          gap: 3,
          mb: 4,
          flexDirection: { xs: "column", lg: "row" },
        }}
      >
        <Card
          sx={{
            flex: 1,
            minHeight: 400,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <CardContent
            sx={{ flexGrow: 1, display: "flex", flexDirection: "column", p: 3 }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: "primary.main", mb: 2 }}
            >
              Contribution Share
            </Typography>
            <Box sx={{ flexGrow: 1, minHeight: 320 }}>
              {metrics.pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={metrics.pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={6}
                    >
                      {metrics.pieChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value) => `₹${value}`}
                      contentStyle={{
                        borderRadius: 12,
                        border: "none",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: "13px", fontWeight: 500 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    height: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography color="text.secondary">
                    No contributions yet.
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Expenses Module */}
        <Card sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <CardContent
            sx={{
              p: "0 !important",
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <Box
              sx={{
                p: 3,
                borderBottom: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "rgba(248, 250, 252, 0.5)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    backgroundColor: "error.light",
                    borderRadius: 2,
                    p: 1,
                    color: "error.main",
                    display: "flex",
                  }}
                >
                  <ReceiptLongIcon />
                </Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: "primary.main" }}
                >
                  Expenses
                </Typography>
              </Box>
            </Box>

            {isAdmin && (
              <Box
                sx={{
                  p: 2,
                  borderBottom: "1px solid #E2E8F0",
                  backgroundColor: "#fff",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: 1.5,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <TextField
                    size="small"
                    label="Expense Name"
                    value={expName}
                    onChange={(e) => setExpName(e.target.value)}
                    sx={{ flex: 2, minWidth: 150 }}
                  />
                  <TextField
                    size="small"
                    label="Amount (₹)"
                    type="number"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    sx={{ flex: 1, minWidth: 100 }}
                    inputProps={{ min: 0 }}
                  />
                  <TextField
                    size="small"
                    type="date"
                    label="Date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    sx={{ flex: 1, minWidth: 140 }}
                    InputLabelProps={{ shrink: true }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    disabled={!expName.trim() || !expAmount}
                    onClick={async () => {
                      await addExpense({
                        name: expName.trim(),
                        amount: Number(expAmount),
                        date: expDate,
                      });
                      setExpName("");
                      setExpAmount("");
                    }}
                    sx={{ borderRadius: 2, boxShadow: "none" }}
                  >
                    Add
                  </Button>
                </Box>
              </Box>
            )}

            <Box
              sx={{
                flexGrow: 1,
                overflowY: "auto",
                maxHeight: { xs: "auto", lg: 400 },
                p: 2,
              }}
            >
              {expenses.length === 0 ? (
                <Box
                  sx={{ py: 6, textAlign: "center", color: "text.secondary" }}
                >
                  No expenses recorded for {currentYear}.
                </Box>
              ) : (
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                >
                  {expenses.map((exp) => (
                    <Box
                      key={exp.id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 2,
                        borderRadius: 3,
                        border: "1px solid #E2E8F0",
                        backgroundColor: "#F8FAFC",
                        transition: "all 0.2s",
                        "&:hover": {
                          backgroundColor: "#fff",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                          borderColor: "error.light",
                        },
                      }}
                    >
                      <Box>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600, color: "text.primary" }}
                        >
                          {exp.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary", fontWeight: 500 }}
                        >
                          {new Date(exp.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 800, color: "error.main" }}
                        >
                          ₹{exp.amount.toLocaleString()}
                        </Typography>
                        {isAdmin && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => deleteExpense(exp.id)}
                            sx={{
                              backgroundColor: "rgba(255,23,68,0.1)",
                              "&:hover": {
                                backgroundColor: "rgba(255,23,68,0.2)",
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* ── 3. Bottom Section: Temple Fund Management ─────────────────────── */}
      <Box sx={{ mb: 4 }}>
        <Card sx={{ display: "flex", flexDirection: "column" }}>
          <CardContent
            sx={{
              p: "0 !important",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                p: 3,
                borderBottom: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "rgba(248, 250, 252, 0.5)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    backgroundColor: "info.light",
                    borderRadius: 2,
                    p: 1,
                    color: "info.main",
                    display: "flex",
                  }}
                >
                  <AccountBalanceIcon />
                </Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: "primary.main" }}
                >
                  Temple Fund Records
                </Typography>
              </Box>
            </Box>

            {isAdmin && (
              <Box
                sx={{
                  p: 2,
                  borderBottom: "1px solid #E2E8F0",
                  backgroundColor: "#fff",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: 1.5,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <TextField
                    size="small"
                    label="Member Name"
                    value={tfMemberName}
                    onChange={(e) => setTfMemberName(e.target.value)}
                    sx={{ flex: 2, minWidth: 200 }}
                  />
                  <TextField
                    size="small"
                    label="Amount (₹)"
                    type="number"
                    value={tfAmount}
                    onChange={(e) => setTfAmount(e.target.value)}
                    sx={{ flex: 1, minWidth: 100 }}
                    inputProps={{ min: 0 }}
                  />
                  <TextField
                    size="small"
                    type="date"
                    label="Date"
                    value={tfDate}
                    onChange={(e) => setTfDate(e.target.value)}
                    sx={{ flex: 1, minWidth: 140 }}
                    InputLabelProps={{ shrink: true }}
                  />
                  <Button
                    variant="contained"
                    color="info"
                    startIcon={<AddIcon />}
                    disabled={!tfMemberName.trim() || !tfAmount}
                    onClick={async () => {
                      await addTempleFund({
                        memberId: "", // Not linked to a specific member ID record anymore for simplicity/outsiders
                        memberName: tfMemberName.trim(),
                        amount: Number(tfAmount),
                        date: tfDate,
                      });
                      setTfMemberName("");
                      setTfAmount("");
                    }}
                    sx={{ borderRadius: 2, boxShadow: "none", color: "#fff" }}
                  >
                    Add Fund
                  </Button>
                </Box>
              </Box>
            )}

            <Box sx={{ p: 2 }}>
              {templeFunds.length === 0 ? (
                <Box
                  sx={{ py: 6, textAlign: "center", color: "text.secondary" }}
                >
                  No temple fund records for {currentYear}.
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, 1fr)",
                      md: "repeat(3, 1fr)",
                      xl: "repeat(4, 1fr)",
                    },
                    gap: 2,
                  }}
                >
                  {templeFunds.map((tf) => (
                    <Box
                      key={tf.id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 2,
                        borderRadius: 3,
                        border: "1px solid #E2E8F0",
                        backgroundColor: "#F8FAFC",
                        transition: "all 0.2s",
                        "&:hover": {
                          backgroundColor: "#fff",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                          borderColor: "info.light",
                        },
                      }}
                    >
                      <Box>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600, color: "text.primary" }}
                        >
                          {tf.memberName}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary", fontWeight: 500 }}
                          >
                            {new Date(tf.date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </Typography>
                        </Box>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 800, color: "info.main" }}
                        >
                          ₹{tf.amount.toLocaleString()}
                        </Typography>
                        {isAdmin && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => deleteTempleFund(tf.id)}
                            sx={{
                              backgroundColor: "rgba(255,23,68,0.05)",
                              "&:hover": {
                                backgroundColor: "rgba(255,23,68,0.1)",
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* ── 3. Bottom Section: Master Consolidation View ───────────────── */}
      <Card sx={{ overflow: "hidden" }}>
        <CardContent sx={{ p: "0 !important" }}>
          <Box
            sx={{
              p: 3,
              borderBottom: "1px solid #E2E8F0",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: "primary.main" }}
            >
              Master Consolidation View
            </Typography>
            <Chip
              label={`${members.length} Members`}
              size="small"
              sx={{
                fontWeight: 600,
                backgroundColor: "rgba(230, 81, 0, 0.1)",
                color: "primary.main",
              }}
            />
          </Box>

          {/* Desktop Table View */}
          <TableContainer sx={{ display: { xs: "none", md: "block" } }}>
            <Table size="medium" sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 200, pl: 3 }}>Member</TableCell>
                  {displayMonths.map(({ name: m, index: i }) => (
                    <TableCell
                      key={i}
                      align="center"
                      sx={{
                        fontSize: "0.75rem",
                        px: 1,
                        borderLeft: "1px solid #f1f5f9",
                      }}
                    >
                      {m.substring(0, 3)}
                    </TableCell>
                  ))}
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 800,
                      color: "primary.main",
                      borderLeft: "1px solid #e2e8f0",
                      pr: 3,
                    }}
                  >
                    Total
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((member, idx) => {
                  const grandTotal = getMemberGrandTotal(member.id);
                  const progress = getMemberProgress(member.id);
                  return (
                    <TableRow
                      key={member.id}
                      hover
                      sx={{
                        backgroundColor: idx % 2 === 0 ? "#fff" : "#F8FAFC",
                        transition: "all 0.2s",
                        "&:hover": {
                          backgroundColor: "#F1F5F9 !important",
                          transform: "scale(1.002)",
                        },
                      }}
                    >
                      <TableCell sx={{ pl: 3 }}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: "primary.main",
                              width: 36,
                              height: 36,
                              fontSize: "1rem",
                              fontWeight: 700,
                            }}
                          >
                            {member.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography
                              sx={{
                                fontWeight: 700,
                                color: "text.primary",
                                fontSize: "0.95rem",
                              }}
                            >
                              {member.name}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mt: 0.5,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 60,
                                  height: 4,
                                  backgroundColor: "#E2E8F0",
                                  borderRadius: 2,
                                  overflow: "hidden",
                                }}
                              >
                                <Box
                                  sx={{
                                    width: `${progress}%`,
                                    height: "100%",
                                    backgroundColor:
                                      progress === 100
                                        ? "success.main"
                                        : "primary.main",
                                  }}
                                />
                              </Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "text.secondary",
                                  fontWeight: 600,
                                  fontSize: "0.65rem",
                                }}
                              >
                                {Math.round(progress)}%
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </TableCell>
                      {displayMonths.map(({ index: i }) => {
                        const entry =
                          ledger[`${currentYear}_${member.id}_${i}`];
                        const isPaid = entry && entry.status === "Paid";
                        const amt = entry
                          ? entry.base + Number(entry.birthday)
                          : 0;
                        return (
                          <TableCell
                            key={i}
                            align="center"
                            sx={{
                              borderLeft: "1px solid #f1f5f9",
                              backgroundColor: isPaid
                                ? "rgba(76, 175, 80, 0.05)"
                                : "transparent",
                            }}
                          >
                            {isPaid ? (
                              <Typography
                                sx={{
                                  color: "success.main",
                                  fontWeight: 700,
                                  fontSize: "0.85rem",
                                }}
                              >
                                ₹{amt}
                              </Typography>
                            ) : (
                              <Typography
                                sx={{
                                  color: "text.disabled",
                                  fontSize: "0.8rem",
                                }}
                              >
                                —
                              </Typography>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 800,
                          color: "primary.main",
                          fontSize: "1rem",
                          borderLeft: "1px solid #e2e8f0",
                          pr: 3,
                        }}
                      >
                        ₹{grandTotal.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Mobile Card List View */}
          <Box sx={{ display: { xs: "block", md: "none" }, p: 2 }}>
            {members.map((member) => {
              const grandTotal = getMemberGrandTotal(member.id);
              const progress = getMemberProgress(member.id);
              return (
                <Card
                  key={member.id}
                  sx={{
                    mb: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: "none",
                    borderRadius: 3,
                  }}
                >
                  <CardContent sx={{ p: "20px !important" }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 3,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: "primary.main",
                            width: 44,
                            height: 44,
                            fontWeight: 700,
                          }}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 800, color: "text.primary" }}
                          >
                            {member.name}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mt: 0.5,
                            }}
                          >
                            <Box
                              sx={{
                                width: 80,
                                height: 6,
                                backgroundColor: "#E2E8F0",
                                borderRadius: 3,
                                overflow: "hidden",
                              }}
                            >
                              <Box
                                sx={{
                                  width: `${progress}%`,
                                  height: "100%",
                                  backgroundColor:
                                    progress === 100
                                      ? "success.main"
                                      : "primary.main",
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          textAlign: "right",
                          backgroundColor: "#F8FAFC",
                          p: 1,
                          borderRadius: 2,
                          border: "1px solid #E2E8F0",
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ fontWeight: 600 }}
                        >
                          Total Paid
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 800, color: "success.main" }}
                        >
                          ₹{grandTotal.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: 1,
                      }}
                    >
                      {displayMonths.map(({ name: m, index: i }) => {
                        const entry = ledger[
                          `${currentYear}_${member.id}_${i}`
                        ] || { status: "Pending", base: 100, birthday: 0 };
                        const isPaid = entry.status === "Paid";
                        const amt = entry.base + Number(entry.birthday);
                        return (
                          <Box
                            key={i}
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              p: 1,
                              borderRadius: 2,
                              border: "1px solid",
                              borderColor: isPaid ? "success.light" : "divider",
                              backgroundColor: isPaid
                                ? "rgba(76, 175, 80, 0.05)"
                                : "#F8FAFC",
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 700,
                                color: isPaid
                                  ? "success.main"
                                  : "text.secondary",
                                fontSize: "0.7rem",
                              }}
                            >
                              {m.substring(0, 3)}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 800,
                                color: isPaid
                                  ? "success.main"
                                  : "text.disabled",
                                fontSize: "0.75rem",
                                mt: 0.5,
                              }}
                            >
                              {isPaid ? `₹${amt}` : "—"}
                            </Typography>
                          </Box>
                        );
                      })}
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

export default Dashboard;
