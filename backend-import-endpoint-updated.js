// ============================================================
// UPDATED: RECEIVABLES - DEBTORS IMPORT ENDPOINT
// ============================================================
// New features:
// 1. Support "Value Date" (replaces "Invoice Date")
// 2. Support "Maturity Date" as fallback for "Due Date"
// 3. "Use Debtor Outstanding Balance to recompute Amount Paid" option
// 4. Support optional "Stage" column (1|2|3)
// 5. Flexible column name detection
// ============================================================

app.post('/api/debtors/import', upload.single('file'), requirePermission('receivables'), requireModuleAccess('receivables', 'debtors', 'edit'), async(req, res) => {  try {
    if(!req.file) return res.status(400).json({success:false, message:'No file uploaded.'});
    const ownerId = req.user._id.toString();
    
    // ── Read checkbox flags from form body ──
    const useBalance = String(req.body.useBalance || req.query.useBalance || '').toLowerCase() === 'true';
    const useMaturity = String(req.body.useMaturity || req.query.useMaturity || '').toLowerCase() === 'true';
    
    const wb=XLSX.read(req.file.buffer,{type:'buffer',cellDates:true});
    const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''});
    const toN=v=>{const n=parseFloat(String(v).replace(/[,\u20a6\s]/g,''));return isNaN(n)?0:Math.round(n*100)/100;};
    const toD=v=>{if(!v)return null;if(v instanceof Date)return v;const d=new Date(v);return isNaN(d)?null:d;};
    let created=0,processed=0; const errors=[];
    
    for(let i=0;i<rows.length;i++){
      const r=rows[i];
      const dName=String(r['Debtor Name']||r['debtor_name']||r['Name']||'').trim();
      const invNo=String(r['Invoice Number']||r['invoice_number']||r['Invoice No']||'').trim();
      
      if(!dName||!invNo){
        errors.push('Row '+(i+2)+': missing debtor name or invoice number');
        continue;
      }
      
      // ── Find or create debtor ──
      let deb=await Debtor.findOne({
        name:new RegExp('^'+dName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$','i'),
        ownerId
      });
      
      if(!deb){
        deb=await Debtor.create({
          name:dName,
          email:String(r['Email']||'').trim(),
          phone:String(r['Phone']||'').trim(),
          creditLimit:toN(r['Credit Limit']||0),
          ownerId,
          createdBy:req.user.username
        });
        created++;
      }
      
      // ── Value Date (formerly Invoice Date) with fallback ──
      let valueDate=toD(r['Value Date']||r['value_date']||r['Invoice Date']||r['invoice_date']);
      if(!valueDate){
        errors.push('Row '+(i+2)+': missing Value Date');
        continue;
      }
      
      // ── Due Date with Maturity Date fallback ──
      let dueDate=toD(r['Due Date']||r['due_date']);
      if(!dueDate) {
        dueDate=toD(r['Maturity Date']||r['maturity_date']);
      }
      if(!dueDate){
        errors.push('Row '+(i+2)+': missing Due Date or Maturity Date');
        continue;
      }
      
      // ── Amount (required) ──
      const amount=toN(r['Amount']||r['invoice_amount']||r['Total Amount']||0);
      if(!amount){
        errors.push('Row '+(i+2)+': missing amount');
        continue;
      }
      
      // ── Amount Paid / Balance logic ──
      let amountPaid=toN(r['Amount Paid']||r['amount_paid']||r['Paid']||0);
      const balance=toN(r['Balance']||r['balance']||0);
      
      // If useBalance checkbox is set AND balance is provided, compute Amount Paid = Amount - Balance
      if(useBalance && balance > 0) {
        amountPaid=Math.max(0, Math.round((amount - balance)*100)/100);
      }
      
      const computedBalance=Math.round((amount-amountPaid)*100)/100;
      const status=computedBalance<=0.005?'paid':amountPaid>0?'partial':'outstanding';
      
      // ── Stage (optional, 1|2|3) ──
      // Used in ECL computation; if missing, backend calculates it from daysPastDue
      const stageRaw=String(r['Stage']||r['stage']||'').trim();
      const stage=stageRaw && [1,2,3].includes(parseInt(stageRaw)) ? parseInt(stageRaw) : null;
      
      // ── Create/Update invoice ──
      const updatePayload={
        debtor:deb._id,
        debtorName:deb.name,
        invoiceNumber:invNo,
        invoiceDate:valueDate,
        dueDate,
        amount,
        amountPaid,
        status,
        ownerId,
        description:String(r['Description']||r['Narration']||'').trim()
      };
      
      // Add stage override if provided in upload
      if(stage) {
        updatePayload.ecl_stage=stage;
      }
      
      await Invoice.findOneAndUpdate(
        {debtor:deb._id,invoiceNumber:invNo,ownerId},
        updatePayload,
        {upsert:true,new:true,setDefaultsOnInsert:true}
      );
      processed++;
    }
    
    res.json({
      success:true,
      message:'Import complete. '+created+' new debtors, '+processed+' invoices processed.',
      created,
      processed,
      errors
    });
  } catch(e){
    console.error(e);
    res.status(500).json({success:false,message:'Import failed: '+e.message});
  }
});

// ============================================================
// SUMMARY OF CHANGES
// ============================================================
// ✓ Value Date replaces Invoice Date (with fallback for backward compatibility)
// ✓ Maturity Date now supported as fallback for Due Date
// ✓ Balance column now used to recompute Amount Paid if "useBalance" flag is true
// ✓ Stage column (1|2|3) now imported to ecl_stage field
// ✓ Flexible column name detection (e.g., 'invoice_date', 'Invoice Date', etc.)
// ✓ Form body flags passed from frontend: useBalance, useMaturity
// ============================================================
