/**
 * FSCF Treasury Intelligence — Database Seeder
 * Run: node seed.js
 * Clears existing data and inserts full sample dataset.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/fscf_treasury";

// ── SCHEMAS (inline for seeder) ──────────────────────────────────────────────
const LoanSchema = new mongoose.Schema({ loanId:String, customer:String, product:String, principal:Number, outstanding:Number, interestRate:Number, startDate:Date, maturityDate:Date, daysPastDue:Number, creditRating:String, stage:Number, status:String, uploadedBy:String, uploadedAt:Date, auditLog:Array });
const BorrowingSchema = new mongoose.Schema({ borrowingId:String, lender:String, type:String, principal:Number, outstanding:Number, interestRate:Number, tenorMonths:Number, repayment:String, maturityDate:Date, uploadedAt:Date, auditLog:Array });
const InvestmentSchema = new mongoose.Schema({ investmentId:String, counterparty:String, type:String, principal:Number, interestRate:Number, dateInvested:Date, tenorDays:Number, maturityDate:Date, uploadedAt:Date, auditLog:Array });
const CashSchema = new mongoose.Schema({ accountId:String, bank:String, accountNo:String, type:String, currency:String, balance:Number, restricted:Boolean, asAt:Date, history:Array });
const UserSchema = new mongoose.Schema({ name:String, email:String, password:String, role:String, createdAt:Date });

const Loan       = mongoose.model("Loan",       LoanSchema);
const Borrowing  = mongoose.model("Borrowing",  BorrowingSchema);
const Investment = mongoose.model("Investment", InvestmentSchema);
const CashAccount= mongoose.model("CashAccount",CashSchema);
const User       = mongoose.model("User",       UserSchema);

function stageFromDPD(dpd) {
  if (dpd >= 90) return 3;
  if (dpd >= 30) return 2;
  return 1;
}

// ── SEED DATA ────────────────────────────────────────────────────────────────
const LOANS = [
  { loanId:"LN-001", customer:"Dangote Industries Ltd",    product:"Invoice Discounting",  principal:450, outstanding:420, interestRate:22, startDate:"2024-01-15", maturityDate:"2024-07-15", daysPastDue:0,   creditRating:"A"   },
  { loanId:"LN-002", customer:"Flour Mills Nigeria Plc",   product:"Supply Chain Finance", principal:320, outstanding:310, interestRate:20, startDate:"2024-02-01", maturityDate:"2024-08-01", daysPastDue:18,  creditRating:"A-"  },
  { loanId:"LN-003", customer:"MTN Nigeria Comms",          product:"Factoring",            principal:280, outstanding:280, interestRate:21, startDate:"2024-03-10", maturityDate:"2024-09-10", daysPastDue:0,   creditRating:"AA"  },
  { loanId:"LN-004", customer:"Zenith Bank Plc",            product:"Reverse Factoring",    principal:500, outstanding:480, interestRate:19, startDate:"2023-11-01", maturityDate:"2024-05-01", daysPastDue:45,  creditRating:"BBB+"},
  { loanId:"LN-005", customer:"BUA Foods Plc",              product:"Invoice Discounting",  principal:190, outstanding:190, interestRate:23, startDate:"2024-04-05", maturityDate:"2024-10-05", daysPastDue:0,   creditRating:"A"   },
  { loanId:"LN-006", customer:"Unilever Nigeria Plc",       product:"Supply Chain Finance", principal:150, outstanding:145, interestRate:21, startDate:"2023-10-15", maturityDate:"2024-04-15", daysPastDue:62,  creditRating:"BB+" },
  { loanId:"LN-007", customer:"Nigerian Breweries Plc",     product:"Factoring",            principal:220, outstanding:215, interestRate:22, startDate:"2024-03-20", maturityDate:"2024-09-20", daysPastDue:5,   creditRating:"A-"  },
  { loanId:"LN-008", customer:"Cadbury Nigeria Plc",        product:"Invoice Discounting",  principal:85,  outstanding:82,  interestRate:24, startDate:"2023-08-01", maturityDate:"2024-02-01", daysPastDue:120, creditRating:"CCC" },
  { loanId:"LN-009", customer:"PZ Cussons Nigeria",         product:"Factoring",            principal:110, outstanding:108, interestRate:22, startDate:"2023-09-10", maturityDate:"2024-03-10", daysPastDue:95,  creditRating:"B-"  },
  { loanId:"LN-010", customer:"Nestle Nigeria Plc",         product:"Supply Chain Finance", principal:340, outstanding:340, interestRate:20, startDate:"2024-04-01", maturityDate:"2024-10-01", daysPastDue:0,   creditRating:"AA-" },
  { loanId:"LN-011", customer:"NNPC Gas & Power Ltd",       product:"Reverse Factoring",    principal:600, outstanding:580, interestRate:18, startDate:"2024-01-20", maturityDate:"2024-07-20", daysPastDue:30,  creditRating:"A+"  },
  { loanId:"LN-012", customer:"Access Bank Plc",            product:"Invoice Discounting",  principal:250, outstanding:250, interestRate:20, startDate:"2024-02-15", maturityDate:"2024-08-15", daysPastDue:0,   creditRating:"AA"  },
  { loanId:"LN-013", customer:"Total Energies Nigeria",     product:"Supply Chain Finance", principal:180, outstanding:172, interestRate:21, startDate:"2023-12-01", maturityDate:"2024-06-01", daysPastDue:75,  creditRating:"BB"  },
  { loanId:"LN-014", customer:"Lafarge Africa Plc",         product:"Factoring",            principal:130, outstanding:130, interestRate:23, startDate:"2024-03-01", maturityDate:"2024-09-01", daysPastDue:0,   creditRating:"A-"  },
  { loanId:"LN-015", customer:"Julius Berger Nigeria",      product:"Invoice Discounting",  principal:200, outstanding:195, interestRate:22, startDate:"2023-06-15", maturityDate:"2023-12-15", daysPastDue:155, creditRating:"D"   },
];

const BORROWINGS = [
  { borrowingId:"BW-001", lender:"FCMB Ltd",             type:"Term Loan",           principal:500,  outstanding:420,  interestRate:19.5, tenorMonths:24, repayment:"Monthly",   maturityDate:"2025-06-30" },
  { borrowingId:"BW-002", lender:"Stanbic IBTC Bank",    type:"Overdraft Facility",  principal:200,  outstanding:150,  interestRate:23,   tenorMonths:12, repayment:"Revolving", maturityDate:"2024-12-31" },
  { borrowingId:"BW-003", lender:"DBN Nigeria",           type:"On-lending Facility", principal:800,  outstanding:720,  interestRate:14,   tenorMonths:36, repayment:"Quarterly", maturityDate:"2026-09-30" },
  { borrowingId:"BW-004", lender:"Bank of Industry",     type:"SME Fund",            principal:300,  outstanding:280,  interestRate:12,   tenorMonths:48, repayment:"Monthly",   maturityDate:"2027-03-31" },
  { borrowingId:"BW-005", lender:"LAPO MfB",             type:"Wholesale Borrowing", principal:150,  outstanding:100,  interestRate:21,   tenorMonths:12, repayment:"Monthly",   maturityDate:"2024-10-31" },
  { borrowingId:"BW-006", lender:"Pan-African Holdings", type:"Intercompany Loan",   principal:1000, outstanding:1000, interestRate:16,   tenorMonths:60, repayment:"Bullet",    maturityDate:"2028-01-31" },
];

const INVESTMENTS = [
  { investmentId:"INV-001", counterparty:"Access Bank Plc",  type:"Fixed Deposit",       principal:300, interestRate:22,   dateInvested:"2024-03-01", tenorDays:180, maturityDate:"2024-08-28" },
  { investmentId:"INV-002", counterparty:"GTBank Ltd",        type:"Fixed Deposit",       principal:200, interestRate:21.5, dateInvested:"2024-02-15", tenorDays:91,  maturityDate:"2024-05-17" },
  { investmentId:"INV-003", counterparty:"FGN Bond (10yr)",   type:"Government Security", principal:500, interestRate:17.5, dateInvested:"2023-10-01", tenorDays:365, maturityDate:"2033-10-01" },
  { investmentId:"INV-004", counterparty:"NTB (91-day)",      type:"Treasury Bills",      principal:250, interestRate:20.5, dateInvested:"2024-04-01", tenorDays:91,  maturityDate:"2024-07-01" },
  { investmentId:"INV-005", counterparty:"Zenith Bank Plc",   type:"Fixed Deposit",       principal:150, interestRate:22,   dateInvested:"2024-04-10", tenorDays:60,  maturityDate:"2024-06-09" },
  { investmentId:"INV-006", counterparty:"NTB (182-day)",     type:"Treasury Bills",      principal:400, interestRate:21,   dateInvested:"2024-01-15", tenorDays:182, maturityDate:"2024-07-15" },
];

const CASH_ACCOUNTS = [
  { accountId:"CA-001", bank:"Access Bank Plc",   accountNo:"001-234567-001", type:"Current",  currency:"NGN", balance:124.5, restricted:false },
  { accountId:"CA-002", bank:"GTBank Ltd",          accountNo:"0123456789",    type:"Current",  currency:"NGN", balance:87.3,  restricted:false },
  { accountId:"CA-003", bank:"First Bank Nigeria",  accountNo:"2012345678",    type:"Current",  currency:"NGN", balance:43.8,  restricted:true  },
  { accountId:"CA-004", bank:"Zenith Bank Plc",     accountNo:"1012345678",    type:"Savings",  currency:"NGN", balance:210.0, restricted:false },
  { accountId:"CA-005", bank:"UBA Plc",             accountNo:"2012398765",    type:"Current",  currency:"NGN", balance:32.1,  restricted:false },
  { accountId:"CA-006", bank:"Access Bank Plc",     accountNo:"001-234567-002",type:"Dom (USD)",currency:"USD", balance:18.4,  restricted:false },
];

// ── SEED FUNCTION ────────────────────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✓ Connected to MongoDB");

    // Clear
    await Promise.all([Loan.deleteMany(), Borrowing.deleteMany(), Investment.deleteMany(), CashAccount.deleteMany(), User.deleteMany()]);
    console.log("✓ Cleared existing data");

    // Users
    const hashed = await bcrypt.hash("Fscf@2024!", 10);
    await User.insertMany([
      { name:"Felix Michael",   email:"felix@fscf.com.ng",   password:hashed, role:"admin",   createdAt:new Date() },
      { name:"Treasury Analyst",email:"analyst@fscf.com.ng", password:hashed, role:"analyst", createdAt:new Date() },
      { name:"Board Viewer",    email:"board@fscf.com.ng",   password:hashed, role:"viewer",  createdAt:new Date() },
    ]);
    console.log("✓ Seeded 3 users  (default password: Fscf@2024!)");

    // Loans
    const loanDocs = LOANS.map(l => ({
      ...l,
      startDate:    new Date(l.startDate),
      maturityDate: new Date(l.maturityDate),
      stage:        stageFromDPD(l.daysPastDue),
      status:       "active",
      uploadedBy:   "seed",
      uploadedAt:   new Date(),
      auditLog:     [{ action:"seeded", by:"system", at:new Date() }],
    }));
    await Loan.insertMany(loanDocs);
    console.log(`✓ Seeded ${loanDocs.length} loans`);

    // Borrowings
    const bDocs = BORROWINGS.map(b => ({ ...b, maturityDate:new Date(b.maturityDate), uploadedAt:new Date(), auditLog:[] }));
    await Borrowing.insertMany(bDocs);
    console.log(`✓ Seeded ${bDocs.length} borrowings`);

    // Investments
    const invDocs = INVESTMENTS.map(i => ({ ...i, dateInvested:new Date(i.dateInvested), maturityDate:new Date(i.maturityDate), uploadedAt:new Date(), auditLog:[] }));
    await Investment.insertMany(invDocs);
    console.log(`✓ Seeded ${invDocs.length} investments`);

    // Cash
    const cashDocs = CASH_ACCOUNTS.map(a => ({ ...a, asAt:new Date(), history:[{ balance:a.balance, asAt:new Date() }] }));
    await CashAccount.insertMany(cashDocs);
    console.log(`✓ Seeded ${cashDocs.length} cash accounts`);

    console.log("\n✅ Seed complete. Default credentials:");
    console.log("   admin:   felix@fscf.com.ng   / Fscf@2024!");
    console.log("   analyst: analyst@fscf.com.ng / Fscf@2024!");
    console.log("   viewer:  board@fscf.com.ng   / Fscf@2024!");
    process.exit(0);
  } catch (e) {
    console.error("✗ Seed failed:", e.message);
    process.exit(1);
  }
}

seed();
