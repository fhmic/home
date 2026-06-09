/**
 * FSCF Treasury Intelligence Platform — Express Backend
 * Mount this alongside your existing eis-recbackend routes.
 * All treasury routes are prefixed /api/treasury/ to avoid collisions.
 *
 * Usage (standalone):  node server.js
 * Usage (merged):      require('./treasury/routes') and mount in your existing server.js
 */

require("dotenv").config();
const express    = require("express");
const mongoose   = require("mongoose");
const cors       = require("cors");
const multer     = require("multer");
const csv        = require("csv-parser");
const XLSX       = require("xlsx");
const fs         = require("fs");
const path       = require("path");
const jwt        = require("jsonwebtoken");
const bcrypt     = require("bcryptjs");
const { Readable } = require("stream");

const app  = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET   = process.env.JWT_SECRET   || "fscf_treasury_secret_change_in_prod";
const MONGO_URI    = process.env.MONGODB_URI   || "mongodb://localhost:27017/fscf_treasury";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "https://elitif.github.io,http://localhost:3000").split(",");

// ── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json({ limit: "10mb" }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ── MONGOOSE CONNECTION ──────────────────────────────────────────────────────
mongoose.connect(MONGO_URI)
  .then(() => console.log("✓ MongoDB connected"))
  .catch(err => console.error("✗ MongoDB error:", err.message));

// ── MODELS ───────────────────────────────────────────────────────────────────

// User
const UserSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true },
  role:      { type: String, enum: ["admin", "analyst", "viewer"], default: "analyst" },
  createdAt: { type: Date, default: Date.now },
});
UserSchema.pre("save", async function(next) {
  if (this.isModified("password")) this.password = await bcrypt.hash(this.password, 10);
  next();
});
const User = mongoose.model("User", UserSchema);

// Loan
const LoanSchema = new mongoose.Schema({
  loanId:       { type: String, required: true, unique: true },
  customer:     { type: String, required: true },
  product:      { type: String, required: true, enum: ["Invoice Discounting","Supply Chain Finance","Factoring","Reverse Factoring"] },
  principal:    { type: Number, required: true, min: 0 },
  outstanding:  { type: Number, required: true, min: 0 },
  interestRate: { type: Number, required: true, min: 0, max: 100 },
  startDate:    { type: Date,   required: true },
  maturityDate: { type: Date,   required: true },
  daysPastDue:  { type: Number, default: 0, min: 0 },
  creditRating: { type: String, default: "NR" },
  stage:        { type: Number, enum: [1, 2, 3], default: 1 },
  status:       { type: String, enum: ["active","settled","written-off"], default: "active" },
  uploadedBy:   { type: String },
  uploadedAt:   { type: Date, default: Date.now },
  auditLog:     [{ action: String, by: String, at: { type: Date, default: Date.now }, note: String }],
});
// Auto-classify stage from DPD before save
LoanSchema.pre("save", function(next) {
  if (this.daysPastDue >= 90)      this.stage = 3;
  else if (this.daysPastDue >= 30) this.stage = 2;
  else                              this.stage = 1;
  next();
});
const Loan = mongoose.model("Loan", LoanSchema);

// Borrowing
const BorrowingSchema = new mongoose.Schema({
  borrowingId:  { type: String, required: true, unique: true },
  lender:       { type: String, required: true },
  type:         { type: String, required: true, enum: ["Term Loan","Overdraft Facility","On-lending Facility","SME Fund","Wholesale Borrowing","Intercompany Loan"] },
  principal:    { type: Number, required: true },
  outstanding:  { type: Number, required: true },
  interestRate: { type: Number, required: true },
  tenorMonths:  { type: Number, required: true },
  repayment:    { type: String, default: "Monthly" },
  maturityDate: { type: Date,   required: true },
  uploadedAt:   { type: Date, default: Date.now },
  auditLog:     [{ action: String, by: String, at: { type: Date, default: Date.now } }],
});
const Borrowing = mongoose.model("Borrowing", BorrowingSchema);

// Investment
const InvestmentSchema = new mongoose.Schema({
  investmentId: { type: String, required: true, unique: true },
  counterparty: { type: String, required: true },
  type:         { type: String, required: true, enum: ["Fixed Deposit","Treasury Bills","Government Security","Commercial Paper"] },
  principal:    { type: Number, required: true },
  interestRate: { type: Number, required: true },
  dateInvested: { type: Date,   required: true },
  tenorDays:    { type: Number, required: true },
  maturityDate: { type: Date },
  uploadedAt:   { type: Date, default: Date.now },
  auditLog:     [{ action: String, by: String, at: { type: Date, default: Date.now } }],
});
InvestmentSchema.pre("save", function(next) {
  if (this.dateInvested && this.tenorDays) {
    this.maturityDate = new Date(this.dateInvested.getTime() + this.tenorDays * 86400000);
  }
  next();
});
const Investment = mongoose.model("Investment", InvestmentSchema);

// CashAccount
const CashAccountSchema = new mongoose.Schema({
  accountId:  { type: String, required: true, unique: true },
  bank:       { type: String, required: true },
  accountNo:  { type: String, required: true },
  type:       { type: String, default: "Current" },
  currency:   { type: String, default: "NGN" },
  balance:    { type: Number, required: true, default: 0 },
  restricted: { type: Boolean, default: false },
  asAt:       { type: Date, default: Date.now },
  history:    [{ balance: Number, asAt: { type: Date, default: Date.now } }],
});
const CashAccount = mongoose.model("CashAccount", CashAccountSchema);

// ── ECL CALCULATION ENGINE ───────────────────────────────────────────────────
const ECL_PARAMS = {
  1: { pd12m: 0.02, pdLifetime: 0.05, lgd: 0.45 },
  2: { pd12m: 0.15, pdLifetime: 0.35, lgd: 0.55 },
  3: { pd12m: 0.75, pdLifetime: 0.90, lgd: 0.65 },
};

function computeECL(loans, pdMultiplier = 1) {
  let totalECL = 0;
  const results = loans.map(l => {
    const p    = ECL_PARAMS[l.stage] || ECL_PARAMS[1];
    const pd   = (l.stage === 1 ? p.pd12m : p.pdLifetime) * pdMultiplier;
    const lgd  = p.lgd;
    const ead  = l.outstanding;
    const ecl  = pd * lgd * ead;
    totalECL  += ecl;
    return {
      loanId:    l.loanId,
      customer:  l.customer,
      stage:     l.stage,
      ead:       +ead.toFixed(2),
      pd:        +pd.toFixed(4),
      lgd:       +lgd.toFixed(4),
      ecl:       +ecl.toFixed(2),
      eclRate:   +(ecl / ead * 100).toFixed(2),
    };
  });
  return {
    loans:         results,
    totalECL:      +totalECL.toFixed(2),
    totalEAD:      +loans.reduce((a, b) => a + b.outstanding, 0).toFixed(2),
    coverageRatio: +(totalECL / loans.reduce((a, b) => a + b.outstanding, 0) * 100).toFixed(2),
    byStage: [1, 2, 3].map(s => {
      const sl   = results.filter(r => r.stage === s);
      const ead  = sl.reduce((a, b) => a + b.ead, 0);
      const ecl  = sl.reduce((a, b) => a + b.ecl, 0);
      return { stage: s, count: sl.length, ead: +ead.toFixed(2), ecl: +ecl.toFixed(2) };
    }),
  };
}

// ── FILE PARSE HELPERS ───────────────────────────────────────────────────────
async function parseUpload(buffer, mimetype) {
  if (mimetype === "text/csv" || mimetype === "application/vnd.ms-excel") {
    return new Promise((resolve, reject) => {
      const rows = [];
      Readable.from(buffer.toString())
        .pipe(csv())
        .on("data", r => rows.push(r))
        .on("end", () => resolve(rows))
        .on("error", reject);
    });
  }
  // XLSX
  const wb   = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const ws   = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}

function normaliseRow(row) {
  // lowercase all keys, trim values
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.toLowerCase().trim().replace(/\s+/g, "_"), typeof v === "string" ? v.trim() : v])
  );
}

// ── AUTH ROUTES ──────────────────────────────────────────────────────────────
app.post("/api/treasury/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "name, email, password required" });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already registered" });
    const user  = await new User({ name, email, password, role }).save();
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "8h" });
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/treasury/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "8h" });
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── LOAN ROUTES ──────────────────────────────────────────────────────────────
app.get("/api/treasury/loans", auth, async (req, res) => {
  try {
    const { stage, product, status } = req.query;
    const filter = {};
    if (stage)   filter.stage   = +stage;
    if (product) filter.product = product;
    if (status)  filter.status  = status;
    const loans = await Loan.find(filter).sort({ daysPastDue: -1 });
    res.json({ count: loans.length, loans });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/treasury/loans", auth, async (req, res) => {
  try {
    const loan = await new Loan({ ...req.body, uploadedBy: req.user.email }).save();
    res.status(201).json(loan);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.put("/api/treasury/loans/:loanId", auth, async (req, res) => {
  try {
    const loan = await Loan.findOneAndUpdate(
      { loanId: req.params.loanId },
      { ...req.body, $push: { auditLog: { action: "updated", by: req.user.email } } },
      { new: true, runValidators: true }
    );
    if (!loan) return res.status(404).json({ error: "Loan not found" });
    res.json(loan);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete("/api/treasury/loans/:loanId", auth, async (req, res) => {
  try {
    await Loan.findOneAndDelete({ loanId: req.params.loanId });
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Upload loans CSV/XLSX
app.post("/api/treasury/loans/upload", auth, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  try {
    const rows   = await parseUpload(req.file.buffer, req.file.mimetype);
    const errors = [], inserted = [];
    for (const [i, raw] of rows.entries()) {
      const r = normaliseRow(raw);
      try {
        const loan = await Loan.findOneAndUpdate(
          { loanId: r.loan_id || r.loanid },
          {
            loanId:       r.loan_id || r.loanid,
            customer:     r.customer_name || r.customer,
            product:      r.loan_product_type || r.product,
            principal:    +r.principal_amount || +r.principal,
            outstanding:  +r.outstanding || +r.principal_amount || +r.principal,
            interestRate: +r.interest_rate || +r.rate,
            startDate:    new Date(r.start_date || r.start),
            maturityDate: new Date(r.maturity_date || r.maturity),
            daysPastDue:  +r.days_past_due || +r.dpd || 0,
            creditRating: r.credit_rating || r.rating || "NR",
            uploadedBy:   req.user.email,
            $push: { auditLog: { action: "uploaded", by: req.user.email } },
          },
          { upsert: true, new: true, runValidators: true }
        );
        inserted.push(loan.loanId);
      } catch (err) {
        errors.push({ row: i + 2, error: err.message });
      }
    }
    res.json({ inserted: inserted.length, errors, errorDetails: errors });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ECL ROUTES ───────────────────────────────────────────────────────────────
app.get("/api/treasury/ecl", auth, async (req, res) => {
  try {
    const pdMultiplier = req.query.pdMultiplier ? +req.query.pdMultiplier : 1;
    const loans = await Loan.find({ status: "active" });
    if (!loans.length) return res.json({ loans: [], totalECL: 0, totalEAD: 0, coverageRatio: 0, byStage: [] });
    res.json(computeECL(loans, pdMultiplier));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Scenario: stress test by adjusting PD
app.post("/api/treasury/ecl/scenario", auth, async (req, res) => {
  try {
    const { pdShiftPct = 0 } = req.body;
    const loans = await Loan.find({ status: "active" });
    const mult  = 1 + pdShiftPct / 100;
    res.json({ pdShiftPct, multiplier: mult, ...computeECL(loans, mult) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── BORROWING ROUTES ─────────────────────────────────────────────────────────
app.get("/api/treasury/borrowings", auth, async (req, res) => {
  try {
    const borrowings = await Borrowing.find().sort({ maturityDate: 1 });
    const totalOutstanding = borrowings.reduce((a, b) => a + b.outstanding, 0);
    const wacd = borrowings.reduce((a, b) => a + (b.outstanding / totalOutstanding) * b.interestRate, 0);
    res.json({ count: borrowings.length, totalOutstanding: +totalOutstanding.toFixed(2), wacd: +wacd.toFixed(4), borrowings });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/treasury/borrowings", auth, async (req, res) => {
  try {
    const b = await new Borrowing(req.body).save();
    res.status(201).json(b);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post("/api/treasury/borrowings/upload", auth, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  try {
    const rows = await parseUpload(req.file.buffer, req.file.mimetype);
    const errors = [], inserted = [];
    for (const [i, raw] of rows.entries()) {
      const r = normaliseRow(raw);
      try {
        const b = await Borrowing.findOneAndUpdate(
          { borrowingId: r.borrowing_id || r.id },
          {
            borrowingId:  r.borrowing_id || r.id,
            lender:       r.lender_name || r.lender,
            type:         r.borrowing_type || r.type,
            principal:    +r.principal,
            outstanding:  +r.outstanding || +r.principal,
            interestRate: +r.interest_rate || +r.rate,
            tenorMonths:  +r.tenor_months || +r.tenor,
            repayment:    r.repayment_schedule || r.repayment || "Monthly",
            maturityDate: new Date(r.maturity_date || r.maturity),
          },
          { upsert: true, new: true, runValidators: true }
        );
        inserted.push(b.borrowingId);
      } catch (err) {
        errors.push({ row: i + 2, error: err.message });
      }
    }
    res.json({ inserted: inserted.length, errors });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── INVESTMENT ROUTES ────────────────────────────────────────────────────────
app.get("/api/treasury/investments", auth, async (req, res) => {
  try {
    const investments = await Investment.find().sort({ maturityDate: 1 });
    const totalPrincipal = investments.reduce((a, b) => a + b.principal, 0);
    const totalInterest  = investments.reduce((a, b) => a + b.principal * (b.interestRate / 100) * (b.tenorDays / 365), 0);
    const avgYield = totalPrincipal > 0
      ? investments.reduce((a, b) => a + (b.principal / totalPrincipal) * b.interestRate, 0)
      : 0;
    res.json({
      count: investments.length,
      totalPrincipal:  +totalPrincipal.toFixed(2),
      totalInterest:   +totalInterest.toFixed(2),
      avgYield:        +avgYield.toFixed(4),
      investments,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/treasury/investments", auth, async (req, res) => {
  try {
    const inv = await new Investment(req.body).save();
    res.status(201).json(inv);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post("/api/treasury/investments/upload", auth, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  try {
    const rows = await parseUpload(req.file.buffer, req.file.mimetype);
    const errors = [], inserted = [];
    for (const [i, raw] of rows.entries()) {
      const r = normaliseRow(raw);
      try {
        const inv = await Investment.findOneAndUpdate(
          { investmentId: r.investment_id || r.id },
          {
            investmentId: r.investment_id || r.id,
            counterparty: r.company_name || r.counterparty,
            type:         r.investment_type || r.type,
            principal:    +r.principal_amount || +r.principal,
            interestRate: +r.interest_rate || +r.rate,
            dateInvested: new Date(r.date_invested || r.date),
            tenorDays:    +r.number_of_days || +r.tenor_days || +r.days,
          },
          { upsert: true, new: true, runValidators: true }
        );
        inserted.push(inv.investmentId);
      } catch (err) {
        errors.push({ row: i + 2, error: err.message });
      }
    }
    res.json({ inserted: inserted.length, errors });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── CASH ROUTES ──────────────────────────────────────────────────────────────
app.get("/api/treasury/cash", auth, async (req, res) => {
  try {
    const accounts = await CashAccount.find().sort({ currency: 1, bank: 1 });
    const ngn = accounts.filter(a => a.currency === "NGN");
    const usd = accounts.filter(a => a.currency === "USD");
    res.json({
      totalNGN:      +ngn.reduce((a, b) => a + b.balance, 0).toFixed(2),
      unrestrictedNGN: +ngn.filter(a => !a.restricted).reduce((a, b) => a + b.balance, 0).toFixed(2),
      restrictedNGN:   +ngn.filter(a =>  a.restricted).reduce((a, b) => a + b.balance, 0).toFixed(2),
      totalUSD:      +usd.reduce((a, b) => a + b.balance, 0).toFixed(2),
      count:         accounts.length,
      accounts,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/treasury/cash", auth, async (req, res) => {
  try {
    const acct = await new CashAccount(req.body).save();
    res.status(201).json(acct);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Update balance (log history)
app.patch("/api/treasury/cash/:accountId/balance", auth, async (req, res) => {
  try {
    const { balance } = req.body;
    if (balance === undefined) return res.status(400).json({ error: "balance required" });
    const acct = await CashAccount.findOneAndUpdate(
      { accountId: req.params.accountId },
      { balance, asAt: new Date(), $push: { history: { balance, asAt: new Date() } } },
      { new: true }
    );
    if (!acct) return res.status(404).json({ error: "Account not found" });
    res.json(acct);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── DASHBOARD SUMMARY ────────────────────────────────────────────────────────
app.get("/api/treasury/dashboard", auth, async (req, res) => {
  try {
    const [loans, borrowings, investments, cashAccounts] = await Promise.all([
      Loan.find({ status: "active" }),
      Borrowing.find(),
      Investment.find(),
      CashAccount.find(),
    ]);

    const eclResult     = loans.length ? computeECL(loans) : { totalECL: 0, coverageRatio: 0 };
    const totalLoans    = loans.reduce((a, b) => a + b.outstanding, 0);
    const totalDebt     = borrowings.reduce((a, b) => a + b.outstanding, 0);
    const totalInv      = investments.reduce((a, b) => a + b.principal, 0);
    const totalCashNGN  = cashAccounts.filter(a => a.currency === "NGN").reduce((a, b) => a + b.balance, 0);
    const netLiquidity  = totalCashNGN + totalInv - totalDebt * 0.1;
    const nplLoans      = loans.filter(l => l.stage === 3);
    const nplRatio      = totalLoans > 0 ? nplLoans.reduce((a, b) => a + b.outstanding, 0) / totalLoans * 100 : 0;
    const wacd          = totalDebt > 0
      ? borrowings.reduce((a, b) => a + (b.outstanding / totalDebt) * b.interestRate, 0)
      : 0;

    res.json({
      asAt: new Date(),
      kpis: {
        totalCashNGN:     +totalCashNGN.toFixed(2),
        netLiquidity:     +netLiquidity.toFixed(2),
        loanBookSize:     +totalLoans.toFixed(2),
        eclProvision:     +eclResult.totalECL.toFixed(2),
        eclCoverage:      +eclResult.coverageRatio.toFixed(2),
        totalBorrowings:  +totalDebt.toFixed(2),
        investmentPortfolio: +totalInv.toFixed(2),
        nplRatio:         +nplRatio.toFixed(2),
        wacd:             +wacd.toFixed(4),
      },
      stageDistribution: eclResult.byStage || [],
      loanCount:   loans.length,
      debtCount:   borrowings.length,
      investCount: investments.length,
      cashCount:   cashAccounts.length,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── HEALTH ───────────────────────────────────────────────────────────────────
app.get("/api/treasury/health", (req, res) => {
  res.json({ status: "ok", module: "FSCF Treasury Intelligence", mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

// ── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`✓ Treasury server running on port ${PORT}`));

module.exports = app;
