import express from 'express';
import cors from 'cors';
import { connectDB, Member, Expense, Ledger, AvailableYear, TempleFund } from './db.js';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB before starting the server
connectDB();

// ── GET all data ──────────────────────────────────────────────────────────────
app.get('/api/data', async (req, res) => {
  try {
    const availableYearsRaw = await AvailableYear.find().sort({ year: 1 });
    const availableYears = availableYearsRaw.map(y => y.year);

    const members = await Member.find();
    const expenses = await Expense.find();

    const ledgerRaw = await Ledger.find();
    const ledger = {};
    for (const row of ledgerRaw) {
      ledger[`${row.year}_${row.memberId}_${row.monthIndex}`] = {
        base: row.base,
        birthday: row.birthday,
        status: row.status,
        source: row.source,
        paidDate: row.paidDate
      };
    }

    const templeFunds = await TempleFund.find();

    res.json({ availableYears, members: members.map(m => m.toJSON()), expenses: expenses.map(e => e.toJSON()), templeFunds: templeFunds.map(t => t.toJSON()), ledger });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── GET expenses (optionally filter by year) ──────────────────────────────────
app.get('/api/expenses', async (req, res) => {
  try {
    const { year } = req.query;
    let expenses;
    if (year) {
      expenses = await Expense.find({ year: parseInt(year, 10) });
    } else {
      expenses = await Expense.find();
    }
    res.json(expenses.map(e => e.toJSON()));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── POST add an expense ───────────────────────────────────────────────────────
app.post('/api/expenses', async (req, res) => {
  try {
    const { name, amount, date, year } = req.body;
    if (!name || amount === undefined || !year) {
      return res.status(400).json({ error: 'name, amount, and year are required' });
    }

    const expenseDate = date || new Date().toISOString().split('T')[0];
    const expenseYear = parseInt(year, 10);

    const newExpense = await Expense.create({
      name,
      amount: Number(amount),
      date: expenseDate,
      year: expenseYear
    });

    res.json({ success: true, expense: newExpense.toJSON() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── DELETE an expense ─────────────────────────────────────────────────────────
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const result = await Expense.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Expense not found' });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── GET temple funds ─────────────────────────────────────────────────────────
app.get('/api/temple-funds', async (req, res) => {
  try {
    const { year } = req.query;
    const funds = year ? await TempleFund.find({ year: parseInt(year, 10) }) : await TempleFund.find();
    res.json(funds.map(t => t.toJSON()));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── POST add a temple fund entry ──────────────────────────────────────────────
app.post('/api/temple-funds', async (req, res) => {
  try {
    console.log('POST /api/temple-funds body:', req.body);
    const { memberId, memberName, amount, date, year } = req.body;
    if (!memberName) return res.status(400).json({ error: 'memberName is required' });
    if (amount === undefined || isNaN(Number(amount))) return res.status(400).json({ error: 'valid amount is required' });
    if (!year) return res.status(400).json({ error: 'year is required' });
    const entry = await TempleFund.create({
      memberId,
      memberName,
      amount: Number(amount),
      date: date || new Date().toISOString().split('T')[0],
      year: parseInt(year, 10)
    });
    res.json({ success: true, fund: entry.toJSON() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── PUT edit a temple fund entry ──────────────────────────────────────────────
app.put('/api/temple-funds/:id', async (req, res) => {
  try {
    const { memberId, memberName, amount, date } = req.body;
    const entry = await TempleFund.findByIdAndUpdate(
      req.params.id,
      { memberId, memberName, amount: Number(amount), date },
      { new: true }
    );
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json({ success: true, fund: entry.toJSON() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── DELETE a temple fund entry ────────────────────────────────────────────────
app.delete('/api/temple-funds/:id', async (req, res) => {
  try {
    const result = await TempleFund.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Entry not found' });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── POST add a new year ───────────────────────────────────────────────────────
app.post('/api/years', async (req, res) => {
  try {
    const { year } = req.body;
    if (!year || isNaN(year)) return res.status(400).json({ error: 'Valid year is required' });
    const yearInt = parseInt(year, 10);

    const existing = await AvailableYear.findOne({ year: yearInt });
    if (existing) {
      return res.status(409).json({ error: `Year ${yearInt} already exists` });
    }

    await AvailableYear.create({ year: yearInt });

    // Initialize ledger entries for every existing member
    const members = await Member.find();
    const bulkOps = [];
    for (const member of members) {
      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        bulkOps.push({
          year: yearInt,
          memberId: member._id.toString(),
          monthIndex,
          base: 100,
          birthday: 0,
          status: 'Pending',
          source: 'Cash',
          paidDate: null
        });
      }
    }
    if (bulkOps.length > 0) {
      await Ledger.insertMany(bulkOps, { ordered: false }).catch(() => {});
    }

    const availableYearsRaw = await AvailableYear.find().sort({ year: 1 });
    res.json({ success: true, availableYears: availableYearsRaw.map(y => y.year) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── POST update a ledger entry ────────────────────────────────────────────────
app.post('/api/ledger', async (req, res) => {
  try {
    const { year, memberId, monthIndex, field, value } = req.body;

    if (year === undefined || memberId === undefined || monthIndex === undefined || !field) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Map frontend field names to Mongoose field names
    let dbField = field;
    if (field === 'paidDate') dbField = 'paidDate'; // same in Mongoose

    const allowedFields = ['base', 'birthday', 'status', 'source', 'paidDate'];
    if (!allowedFields.includes(dbField)) {
      return res.status(400).json({ error: 'Invalid field' });
    }

    // Upsert: create if not exists, then update the specific field
    const defaultValues = { base: 100, birthday: 0, status: 'Pending', source: 'Cash', paidDate: null };
    // Remove the field being updated from defaults so there's no conflict in $setOnInsert
    delete defaultValues[dbField];

    const updatedEntry = await Ledger.findOneAndUpdate(
      { year, memberId: memberId.toString(), monthIndex },
      { $set: { [dbField]: value }, $setOnInsert: defaultValues },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      entry: {
        base: updatedEntry.base,
        birthday: updatedEntry.birthday,
        status: updatedEntry.status,
        source: updatedEntry.source,
        paidDate: updatedEntry.paidDate
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── POST bulk update ledger entries ──────────────────────────────────────────
app.post('/api/ledger/bulk', async (req, res) => {
  try {
    const { updates } = req.body; // Array of { year, memberId, monthIndex, updates: { base, birthday, status, source, paidDate } }
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ error: 'updates array is required' });
    }

    const bulkOps = updates.map(op => ({
      updateOne: {
        filter: { year: op.year, memberId: op.memberId.toString(), monthIndex: op.monthIndex },
        update: { $set: op.updates },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
      await Ledger.bulkWrite(bulkOps);
    }

    // Return the updated ledger for sync
    const ledgerRaw = await Ledger.find();
    const ledger = {};
    for (const row of ledgerRaw) {
      ledger[`${row.year}_${row.memberId}_${row.monthIndex}`] = {
        base: row.base,
        birthday: row.birthday,
        status: row.status,
        source: row.source,
        paidDate: row.paidDate
      };
    }

    res.json({ success: true, ledger });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── POST add a new member ─────────────────────────────────────────────────────
app.post('/api/members', async (req, res) => {
  try {
    const { name, mobile } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const newMember = await Member.create({ name, mobile: mobile || '' });
    const newId = newMember._id.toString();

    // Initialize entries across ALL existing years
    const years = await AvailableYear.find();
    const bulkOps = [];
    for (const y of years) {
      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        bulkOps.push({
          year: y.year,
          memberId: newId,
          monthIndex,
          base: 100,
          birthday: 0,
          status: 'Pending',
          source: 'Cash',
          paidDate: null
        });
      }
    }
    if (bulkOps.length > 0) {
      await Ledger.insertMany(bulkOps, { ordered: false }).catch(() => {});
    }

    // Return the full ledger so the frontend state is in sync
    const ledgerRaw = await Ledger.find();
    const ledger = {};
    for (const row of ledgerRaw) {
      ledger[`${row.year}_${row.memberId}_${row.monthIndex}`] = {
        base: row.base,
        birthday: row.birthday,
        status: row.status,
        source: row.source,
        paidDate: row.paidDate
      };
    }

    res.json({ success: true, member: newMember.toJSON(), ledger });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── PUT edit a member ─────────────────────────────────────────────────────────
app.put('/api/members/:id', async (req, res) => {
  try {
    const { name, mobile } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const member = await Member.findByIdAndUpdate(
      req.params.id,
      { name, mobile: mobile || '' },
      { new: true }
    );
    if (!member) return res.status(404).json({ error: 'Member not found' });

    res.json({ success: true, member: member.toJSON() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── DELETE a member ───────────────────────────────────────────────────────────
app.delete('/api/members/:id', async (req, res) => {
  try {
    const memberId = req.params.id;

    const result = await Member.findByIdAndDelete(memberId);
    if (!result) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Also delete all their ledger entries
    await Ledger.deleteMany({ memberId: memberId.toString() });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
