import { formatDate, formatRupees, numberToWords } from '../utils/formatters';

const KB = {
  name: 'Kuchhal Brothers',
  tagline: 'sensormart.in',
  addr: '982/1M, 983M Saleempur Rajputana Industrial Area\nRoorkee-247667, Uttarakhand',
  gstin: '05AWBPA1798G1ZS',
  phone: '+91 7017880914',
  email: 'kuchhalbrothers@gmail.com',
  website: 'www.sensormart.in',
  bank: {
    name: 'Canara Bank',
    addr: 'Maqtool Puri, Roorkee',
    ac: '2200261012427',
    ifsc: 'CNRB0002200',
  },
  terms: [
    'Validity of Quote: 30 days',
    'Delivery Time: 2-3 weeks',
    'Factory Warranty: 1 year against manufacturing defects',
    'Payments: 100% advance against PI',
    'Transit Insurance: extra @ 2% of invoice value if required',
    'All civil, Mechanical and Electrical works in customers account only',
    'PO shall be non-cancellable and non-returnable basis only',
    'Shipping will be done through DTDC courier by road basis',
  ],
};

export function generateQuotationHtml(q: any): string {
  const items = q.items || [];
  
  let sub = 0;
  let taxSum = 0;

  items.forEach((item: any) => {
    const qty = parseFloat(item.qty || 1);
    const rate = parseFloat(item.rate || 0);
    const taxRate = parseFloat(item.tax || 18);
    const amt = qty * rate;
    sub += amt;
    taxSum += amt * (taxRate / 100);
  });

  const total = sub + taxSum;
  const totalWords = numberToWords(total);

  const freightLabel = q.freightType === 'extra' ? 'EXTRA'
    : q.freightType === 'custom' ? formatRupees(q.freightAmt || 0)
    : 'Included';
  const instLabel = q.instType === 'extra' ? 'EXTRA' : 'Included';

  const headerBrandingHtml = q.companyLogo && q.companyLogo.length > 20
    ? `<img src="${q.companyLogo}" style="max-height:55px;max-width:240px;object-fit:contain;display:block;" alt="Company Logo" />`
    : `
    <div style="display:flex;align-items:center;gap:8px;">
      <div style="background:#fff;color:#1a3a1a;font-weight:900;font-size:18px;
        border-radius:50%;width:38px;height:38px;display:flex;align-items:center;
        justify-content:center;flex-shrink:0;">KB</div>
      <div>
        <div style="font-size:16px;font-weight:800;letter-spacing:0.2px;color:#fff;">Kuchhal Brothers</div>
        <div style="font-size:11px;opacity:0.85;color:#e0e0e0;">sensormart.in</div>
      </div>
    </div>`;

  // Item rows rendering
  const itemRowsHtml = items.map((item: any, idx: number) => {
    const qty = parseFloat(item.qty || 1);
    const rate = parseFloat(item.rate || 0);
    const amt = qty * rate;
    const lines = (item.description || '').split('\n');
    const name = lines[0] || '';
    const specs = lines.slice(1).join('\n');
    
    // Render item photo if present (Base64 string or absolute URL string)
    const photoImg = item.photo && item.photo.length > 20
      ? `<img src="${item.photo}" style="width:50px;height:50px;object-fit:contain;display:block;margin:2px auto;border-radius:4px;" />`
      : '';

    return `
      <tr>
        <td style="padding:8px;border:1px solid #c8c8c8;text-align:center;font-size:11px;vertical-align:top;">${idx + 1}</td>
        <td style="padding:8px;border:1px solid #c8c8c8;vertical-align:top;">
          ${photoImg}
          <div style="font-size:12px;font-weight:700;color:#111;margin-top:2px;text-align:center;">${name}</div>
        </td>
        <td style="padding:8px;border:1px solid #c8c8c8;font-size:11px;white-space:pre-line;vertical-align:top;color:#333;line-height:1.4;">${specs}</td>
        <td style="padding:8px;border:1px solid #c8c8c8;text-align:right;font-size:12px;vertical-align:top;">${qty}</td>
        <td style="padding:8px;border:1px solid #c8c8c8;text-align:right;font-size:12px;vertical-align:top;">${rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td style="padding:8px;border:1px solid #c8c8c8;text-align:right;font-size:12px;font-weight:700;vertical-align:top;color:#111;">${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      </tr>`;
  }).join('');

  const taxBlockHtml = q.taxType === 'igst'
    ? `<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px;"><span>CGST:</span><span>₹0.00</span></div>
       <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px;"><span>SGST:</span><span>₹0.00</span></div>
       <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px;"><span>IGST:</span>
         <span style="color:#b30000;font-weight:700;">${formatRupees(taxSum)}</span></div>`
    : `<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px;"><span>CGST:</span>
         <span>${formatRupees(taxSum / 2)}</span></div>
       <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px;"><span>SGST:</span>
         <span>${formatRupees(taxSum / 2)}</span></div>
       <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px;"><span>IGST:</span><span>₹0.00</span></div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Quotation ${q.quoteNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&display=swap');
    body {
      margin: 0;
      padding: 0;
      background: #fff;
      font-family: 'DM Sans', Arial, sans-serif;
      color: #1a1a1a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 15mm;
      box-sizing: border-box;
      margin: 0 auto;
    }
    .header-bar {
      background: #1a3a1a;
      color: #fff;
      padding: 12px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 6px 6px 0 0;
    }
    .bordered {
      border: 1px solid #ccc;
      border-top: none;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
    }
  </style>
</head>
<body>
  <div class="page">
    
    <!-- Top Brand Header -->
    <div class="header-bar">
      ${headerBrandingHtml}
      <div style="font-size:10px;text-align:right;opacity:0.9;line-height:1.6;">
        ${KB.phone}<br/>${KB.email}<br/>${KB.website}
      </div>
    </div>

    <!-- Company Address -->
    <div class="bordered" style="padding:8px 14px;text-align:center;font-size:11px;font-weight:600;color:#333;">
      ${KB.addr.replace('\n', ', ')}
    </div>

    <!-- GSTIN Banner -->
    <div class="bordered" style="padding:6px 14px;text-align:center;font-size:11px;font-weight:700;background:#f4f6f4;color:#1a3a1a;">
      GSTIN: ${KB.gstin}
    </div>

    <!-- Banker & Reference Block -->
    <div class="grid-2 bordered">
      <div style="padding:8px 12px;border-right:1px solid #ccc;">
        <div style="font-size:11px;font-weight:700;margin-bottom:3px;color:#111;">
          Banker Details: ${KB.bank.name}
        </div>
        <div style="font-size:10px;color:#555;line-height:1.6;">
          Address: ${KB.bank.addr}<br>
          A/C#: <strong>${KB.bank.ac}</strong><br>
          IFSC: <strong>${KB.bank.ifsc}</strong>
        </div>
      </div>
      <div style="padding:8px 12px;font-size:10px;color:#666;text-align:right;line-height:1.6;">
        Original For Recipient<br>
        Duplicate for Transporter<br>
        Triplicate for Supplier
      </div>
    </div>

    <!-- QUOTATION Title -->
    <div class="bordered" style="padding:10px 14px;text-align:center;font-size:20px;font-weight:900;letter-spacing:1.5px;color:#1a3a1a;">
      QUOTATION
    </div>

    <!-- Metadata Grid -->
    <div class="grid-4 bordered" style="font-size:11px;">
      <div style="padding:6px 10px;border-right:1px solid #ccc;">
        <div style="font-weight:700;color:#555;margin-bottom:2px;">Quote No</div>
        <strong style="color:#111;font-size:12px;">${q.quoteNumber}</strong>
      </div>
      <div style="padding:6px 10px;border-right:1px solid #ccc;">
        <div style="font-weight:700;color:#555;margin-bottom:2px;">Quote Date</div>
        <span style="color:#111;">${formatDate(q.quoteDate)}</span>
      </div>
      <div style="padding:6px 10px;border-right:1px solid #ccc;">
        <div style="font-weight:700;color:#555;margin-bottom:2px;">Transportation</div>
        <span style="color:#111;">${q.transport || 'By road / Courier'}</span>
      </div>
      <div style="padding:6px 10px;">
        <div style="font-weight:700;color:#555;margin-bottom:2px;">Validity of Quote</div>
        <span style="color:#111;">${q.validTill ? formatDate(q.validTill) : '30 days'}</span>
      </div>
    </div>

    <div class="grid-2 bordered" style="font-size:11px;">
      <div style="padding:6px 10px;border-right:1px solid #ccc;">
        <span style="font-weight:700;color:#555;">State:</span> <strong style="color:#111;">${q.billState || '—'}</strong>
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <span style="font-weight:700;color:#555;">Customer Ref.:</span> <strong style="color:#111;">${q.custRef || '—'}</strong>
      </div>
      <div style="padding:6px 10px;">
        <span style="font-weight:700;color:#555;">Email:</span> <span style="color:#111;">${q.billEmail || '—'}</span>
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <span style="font-weight:700;color:#555;">Payment Terms:</span> <strong style="color:#111;">${q.payTerms || '100% Advance'}</strong>
      </div>
    </div>

    <!-- Parties details -->
    <div class="grid-2 bordered" style="font-size:11px;">
      <div style="padding:10px 12px;border-right:1px solid #ccc;">
        <div style="font-weight:700;margin-bottom:5px;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#777;">
          Details of Receiver | Billed to:
        </div>
        <div style="font-weight:800;font-size:13px;color:#111;">${q.billName || 'Valued Customer'}</div>
        ${q.billContact ? `<div style="color:#444;margin-top:2px;">Attn: ${q.billContact}</div>` : ''}
        <div style="line-height:1.6;margin-top:4px;color:#333;">${(q.billAddr || '').replace(/\n/g, '<br>')}</div>
        ${q.billPhone ? `<div style="margin-top:4px;color:#444;">Ph: ${q.billPhone}</div>` : ''}
        ${q.billState ? `<div style="margin-top:6px;font-weight:700;color:#1a3a1a;background:#f9f9f9;padding:2px 4px;display:inline-block;border-radius:2px;">STATE: ${q.billState} &nbsp;|&nbsp; Code: ${q.billStateCode || '—'}</div>` : ''}
      </div>
      <div style="padding:10px 12px;">
        <div style="font-weight:700;margin-bottom:5px;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#777;">
          Details of Consignee | Shipped to:
        </div>
        <div style="font-weight:800;font-size:13px;color:#111;">${q.shipName || q.billName || 'Valued Customer'}</div>
        ${q.shipContact ? `<div style="color:#444;margin-top:2px;">Attn: ${q.shipContact}</div>` : ''}
        <div style="line-height:1.6;margin-top:4px;color:#333;">${(q.shipAddr || q.billAddr || '').replace(/\n/g, '<br>')}</div>
        ${q.shipPhone ? `<div style="margin-top:4px;color:#444;">Ph: ${q.shipPhone}</div>` : ''}
        ${q.shipState ? `<div style="margin-top:6px;font-weight:700;color:#1a3a1a;background:#f9f9f9;padding:2px 4px;display:inline-block;border-radius:2px;">STATE: ${q.shipState} &nbsp;|&nbsp; Code: ${q.shipStateCode || '—'}</div>` : ''}
      </div>
    </div>

    <!-- Items Table -->
    <table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:0;">
      <thead>
        <tr style="background:#f4f6f4;color:#1a3a1a;">
          <th style="padding:8px;border:1px solid #c8c8c8;width:30px;text-align:center;">Sr.</th>
          <th style="padding:8px;border:1px solid #c8c8c8;text-align:left;width:140px;">Item / Photo</th>
          <th style="padding:8px;border:1px solid #c8c8c8;text-align:left;">Specifications</th>
          <th style="padding:8px;border:1px solid #c8c8c8;text-align:right;width:40px;">Qty</th>
          <th style="padding:8px;border:1px solid #c8c8c8;text-align:right;width:90px;">Rate (₹)</th>
          <th style="padding:8px;border:1px solid #c8c8c8;text-align:right;width:100px;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${itemRowsHtml.length ? itemRowsHtml : `<tr><td colspan="6" style="text-align:center;padding:15px;color:#888;">No items added to quotation</td></tr>`}
      </tbody>
    </table>

    <!-- Financial summary block -->
    <div class="grid-2 bordered" style="font-size:12px;">
      <div style="padding:10px 14px;border-right:1px solid #ccc;display:flex;flex-direction:column;justify-content:space-between;">
        <div>
          <div style="font-weight:700;color:#1a3a1a;margin-bottom:8px;">For Kuchhal Brothers</div>
          ${q.authSignature && q.authSignature.length > 20 ? `<img src="${q.authSignature}" style="max-height:50px;max-width:150px;object-fit:contain;display:block;margin:6px 0;" alt="Authorized Signature" />` : `<div style="height:50px;display:flex;align-items:center;color:#aaa;font-size:11px;font-style:italic;">(Authorized Digital Output)</div>`}
        </div>
        <div style="font-weight:700;font-size:11px;color:#555;border-top:1px dashed #eee;padding-top:4px;">
          Authorized Signatory
        </div>
      </div>
      <div style="padding:10px 14px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
          <span style="color:#555;">Freight Charges:</span>
          <strong style="color:#b35900;">${freightLabel}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
          <span style="color:#555;">Installation Charges:</span>
          <strong>${instLabel}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;border-top:1px solid #ddd;padding-top:5px;margin-top:5px;font-size:11px;">
          <span style="color:#111;font-weight:700;">Total Before Tax:</span>
          <strong style="color:#111;font-size:12px;">${formatRupees(sub)}</strong>
        </div>
        <div style="font-size:11px;font-weight:700;margin-top:8px;margin-bottom:3px;color:#555;">Tax Calculation:</div>
        ${taxBlockHtml}
      </div>
    </div>

    <!-- Amount in Words & Final Total Banner -->
    <div class="grid-2 bordered" style="font-size:11px;">
      <div style="padding:8px 12px;border-right:1px solid #ccc;">
        <div style="font-weight:700;color:#555;">Total Quote Amount in Words:</div>
        <div style="color:#b30000;font-weight:800;margin-top:3px;font-size:12px;">${totalWords}</div>
      </div>
      <div style="padding:8px 12px;display:flex;justify-content:space-between;align-items:center;background:#fcfdfc;">
        <div>
          <div style="font-weight:800;color:#1a3a1a;font-size:12px;">Total Amount After Tax</div>
          <div style="font-size:9px;color:#777;margin-top:2px;">Subject to Roorkee Jurisdiction. E &amp; O. E</div>
        </div>
        <div style="font-size:18px;font-weight:900;color:#1a3a1a;">
          ${formatRupees(total)}
        </div>
      </div>
    </div>

    <!-- Terms and Conditions Block -->
    <div class="bordered" style="padding:12px 14px;">
      <div style="font-size:11px;font-weight:700;color:#1a3a1a;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.05em;">Terms &amp; Conditions of Quote:</div>
      <ol style="padding-left:16px;margin:0;font-size:10px;color:#444;line-height:1.8;">
        ${KB.terms.map(t => `<li>${t}</li>`).join('')}
        ${q.delivTime ? `<li><strong>Delivery Specifics:</strong> ${q.delivTime}</li>` : ''}
        ${q.warranty ? `<li><strong>Warranty Specifics:</strong> ${q.warranty} ${q.warrantyStart ? `(Starting from ${q.warrantyStart})` : ''}</li>` : ''}
      </ol>
    </div>

    <!-- Bottom Stamp Footer -->
    <div style="background:#1a3a1a;color:#fff;text-align:center;padding:8px 14px;font-size:10px;font-weight:700;border-radius:0 0 6px 6px;letter-spacing:0.5px;">
      982/1M, 983M, Salempur Rajputana Industrial Area, Roorkee-247667, Uttarakhand
    </div>

  </div>
</body>
</html>`;
}
