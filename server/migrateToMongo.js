/**
 * One-time migration script: database.json → MongoDB Atlas
 * 
 * Usage: node migrateToMongo.js
 * 
 * Reads all data from the existing database.json file
 * and inserts it into your MongoDB Atlas cluster.
 * Run this ONCE after setting up your .env connection string.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Member, Expense, Ledger, AvailableYear } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrate = async () => {
  // 1. Connect to MongoDB
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in .env file');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB Atlas');

  // 2. Read database.json
  const jsonPath = path.join(__dirname, 'database.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ database.json not found at:', jsonPath);
    await mongoose.disconnect();
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(rawData);
  console.log('✅ Loaded database.json');

  try {
    // 3. Clear existing MongoDB data (fresh migration)
    await Member.deleteMany({});
    await Expense.deleteMany({});
    await Ledger.deleteMany({});
    await AvailableYear.deleteMany({});
    console.log('✅ Cleared existing MongoDB collections');

    // 4. Migrate available_years
    const years = data.availableYears || [];
    if (years.length > 0) {
      await AvailableYear.insertMany(years.map(y => ({ year: y })));
      console.log(`✅ Migrated ${years.length} years: [${years.join(', ')}]`);
    }

    // 5. Migrate members (map old integer IDs → new Mongo IDs)
    const oldMembers = data.members || [];
    const idMap = {}; // oldId (number) → newMongoId (string)

    for (const m of oldMembers) {
      const newMember = await Member.create({ name: m.name, mobile: m.mobile || '' });
      idMap[m.id] = newMember._id.toString();
    }
    console.log(`✅ Migrated ${oldMembers.length} members`);

    // 6. Migrate expenses
    const oldExpenses = data.expenses || [];
    if (oldExpenses.length > 0) {
      await Expense.insertMany(oldExpenses.map(e => ({
        name: e.name,
        amount: e.amount,
        date: e.date,
        year: e.year
      })));
      console.log(`✅ Migrated ${oldExpenses.length} expenses`);
    }

    // 7. Migrate ledger entries
    // Keys are in format: "year_oldMemberId_monthIndex"
    const ledger = data.ledger || {};
    const ledgerDocs = [];

    for (const [key, entry] of Object.entries(ledger)) {
      const parts = key.split('_');
      const year = parseInt(parts[0], 10);
      const oldMemberId = parseInt(parts[1], 10);
      const monthIndex = parseInt(parts[2], 10);

      const newMemberId = idMap[oldMemberId];
      if (!newMemberId) {
        console.warn(`⚠️  Skipping ledger key "${key}" — member ID ${oldMemberId} not found in members list`);
        continue;
      }

      ledgerDocs.push({
        year,
        memberId: newMemberId,
        monthIndex,
        base: entry.base ?? 100,
        birthday: entry.birthday ?? 0,
        status: entry.status ?? 'Pending',
        source: entry.source ?? 'Cash',
        paidDate: entry.paidDate || null
      });
    }

    if (ledgerDocs.length > 0) {
      await Ledger.insertMany(ledgerDocs);
      console.log(`✅ Migrated ${ledgerDocs.length} ledger entries`);
    }

    // Print ID mapping for reference
    console.log('\n📋 Member ID Mapping (old → new):');
    for (const [oldId, newId] of Object.entries(idMap)) {
      const member = oldMembers.find(m => m.id === parseInt(oldId));
      console.log(`   ${member?.name}: ${oldId} → ${newId}`);
    }

    console.log('\n🎉 Migration complete! All data from database.json is now in MongoDB Atlas.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
};

migrate();
