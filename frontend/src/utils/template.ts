/**
 * Client-side real-time HTML document compiler mapping live React state variables
 * into printable/previewable standalone A4 layout markup matching backend presentation exactly.
 */

export function formatRupees(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const dt = new Date(dateString);
    if (isNaN(dt.getTime())) return dateString;
    return String(dt.getDate()).padStart(2, '0') + '/' +
           String(dt.getMonth() + 1).padStart(2, '0') + '/' +
           dt.getFullYear();
  } catch {
    return dateString;
  }
}

export function numberToWords(n: number): string {
  if (isNaN(n) || n === 0) return 'Zero Rupees only';
  
  const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  
  const iw = (num: number): string => {
    if (num < 20) return a[num];
    if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? ' ' + a[num % 10] : '');
    if (num < 1000) return a[Math.floor(num / 100)] + ' hundred' + (num % 100 ? ' ' + iw(num % 100) : '');
    if (num < 100000) return iw(Math.floor(num / 1000)) + ' thousand' + (num % 1000 ? ' ' + iw(num % 1000) : '');
    if (num < 1000000) return iw(Math.floor(num / 100000)) + ' lakh' + (num % 100000 ? ' ' + iw(num % 100000) : '');
    if (num < 10000000) return iw(Math.floor(num / 100000)) + ' lakh' + (num % 100000 ? ' ' + iw(num % 100000) : '');
    return iw(Math.floor(num / 10000000)) + ' crore' + (num % 10000000 ? ' ' + iw(num % 10000000) : '');
  };

  const fixedStr = n.toFixed(2);
  const parts = fixedStr.split('.');
  const integerPart = parseInt(parts[0], 10);
  const decimalPart = parseInt(parts[1], 10);

  let words = iw(integerPart).trim();
  words = words.charAt(0).toUpperCase() + words.slice(1);

  if (decimalPart > 0) {
    words += ' and ' + iw(decimalPart).trim() + ' paise';
  }

  return words + ' only';
}

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

export function generateLivePreviewHtml(q: any): string {
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

  const freightAmt = parseFloat(q.freightAmt || 0);
  const total = sub + taxSum + (q.freightType === 'custom' ? freightAmt : 0);
  const totalWords = numberToWords(total);

  const freightLabel = q.freightType === 'extra' ? 'EXTRA'
    : q.freightType === 'custom' ? formatRupees(freightAmt)
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

  const itemRowsHtml = items.map((item: any, idx: number) => {
    const qty = parseFloat(item.qty || 1);
    const rate = parseFloat(item.rate || 0);
    const amt = qty * rate;
    const lines = (item.description || '').split('\n');
    const name = lines[0] || '';
    const specs = lines.slice(1).join('\n');
    
    const photoImg = item.photo && item.photo.length > 20
      ? `<img src="${item.photo}" style="width:45px;height:45px;object-fit:contain;display:block;margin:2px auto;border-radius:4px;" />`
      : '';

    return `
      <tr>
        <td style="padding:6px;border:1px solid #c8c8c8;text-align:center;font-size:11px;vertical-align:top;">${idx + 1}</td>
        <td style="padding:6px;border:1px solid #c8c8c8;vertical-align:top;">
          ${photoImg}
          <div style="font-size:12px;font-weight:700;color:#111;margin-top:2px;text-align:center;">${name}</div>
        </td>
        <td style="padding:6px;border:1px solid #c8c8c8;font-size:11px;white-space:pre-line;vertical-align:top;color:#333;line-height:1.4;">${specs}</td>
        <td style="padding:6px;border:1px solid #c8c8c8;text-align:right;font-size:12px;vertical-align:top;">${qty}</td>
        <td style="padding:6px;border:1px solid #c8c8c8;text-align:right;font-size:12px;vertical-align:top;">${rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td style="padding:6px;border:1px solid #c8c8c8;text-align:right;font-size:12px;font-weight:700;vertical-align:top;color:#111;">${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      </tr>`;
  }).join('');

  const taxBlockHtml = q.taxType === 'igst'
    ? `<div style="display:flex;justify-content:space-between;padding:2px 0;font-size:11px;"><span>CGST:</span><span>₹0.00</span></div>
       <div style="display:flex;justify-content:space-between;padding:2px 0;font-size:11px;"><span>SGST:</span><span>₹0.00</span></div>
       <div style="display:flex;justify-content:space-between;padding:2px 0;font-size:11px;"><span>IGST:</span>
         <span style="color:#b30000;font-weight:700;">${formatRupees(taxSum)}</span></div>`
    : `<div style="display:flex;justify-content:space-between;padding:2px 0;font-size:11px;"><span>CGST:</span>
         <span>${formatRupees(taxSum / 2)}</span></div>
       <div style="display:flex;justify-content:space-between;padding:2px 0;font-size:11px;"><span>SGST:</span>
         <span>${formatRupees(taxSum / 2)}</span></div>
       <div style="display:flex;justify-content:space-between;padding:2px 0;font-size:11px;"><span>IGST:</span><span>₹0.00</span></div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&display=swap');
    body {
      margin: 0;
      padding: 10px;
      background: #fcfdfc;
      font-family: 'DM Sans', Arial, sans-serif;
      color: #1a1a1a;
    }
    .preview-container {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      overflow: hidden;
    }
    .header-bar {
      background: #1a3a1a;
      color: #fff;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .bordered {
      border-bottom: 1px solid #ddd;
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
  <div class="preview-container">
    
    <div class="header-bar">
      ${headerBrandingHtml}
      <div style="font-size:10px;text-align:right;opacity:0.9;line-height:1.5;">
        ${KB.phone}<br/>${KB.email}<br/>${KB.website}
      </div>
    </div>

    <div class="bordered" style="padding:6px 12px;text-align:center;font-size:11px;font-weight:600;color:#333;background:#fcfcfc;">
      ${KB.addr.replace('\n', ', ')}
    </div>

    <div class="bordered" style="padding:4px 12px;text-align:center;font-size:10px;font-weight:700;background:#f4f6f4;color:#1a3a1a;">
      GSTIN: ${KB.gstin}
    </div>

    <div class="grid-2 bordered">
      <div style="padding:6px 10px;border-right:1px solid #ddd;">
        <div style="font-size:10px;font-weight:700;color:#111;">Banker: ${KB.bank.name}</div>
        <div style="font-size:9px;color:#555;margin-top:2px;">
          A/C#: <strong>${KB.bank.ac}</strong> | IFSC: <strong>${KB.bank.ifsc}</strong>
        </div>
      </div>
      <div style="padding:6px 10px;font-size:9px;color:#666;text-align:right;">
        Original For Recipient<br>Duplicate for Transporter
      </div>
    </div>

    <div class="bordered" style="padding:8px 12px;text-align:center;font-size:16px;font-weight:900;letter-spacing:1px;color:#1a3a1a;background:#fdfefd;">
      QUOTATION PREVIEW
    </div>

    <div class="grid-4 bordered" style="font-size:10px;background:#fff;">
      <div style="padding:5px 8px;border-right:1px solid #ddd;">
        <div style="color:#777;font-size:9px;">Quote No</div>
        <strong style="color:#111;">${q.quoteNumber || '—'}</strong>
      </div>
      <div style="padding:5px 8px;border-right:1px solid #ddd;">
        <div style="color:#777;font-size:9px;">Quote Date</div>
        <span style="color:#111;">${formatDate(q.quoteDate)}</span>
      </div>
      <div style="padding:5px 8px;border-right:1px solid #ddd;">
        <div style="color:#777;font-size:9px;">Transport</div>
        <span style="color:#111;line-clamp:1;">${q.transport || '—'}</span>
      </div>
      <div style="padding:5px 8px;">
        <div style="color:#777;font-size:9px;">Valid Till</div>
        <span style="color:#111;">${q.validTill ? formatDate(q.validTill) : '—'}</span>
      </div>
    </div>

    <div class="grid-2 bordered" style="font-size:10px;">
      <div style="padding:8px 10px;border-right:1px solid #ddd;">
        <div style="font-weight:700;font-size:9px;color:#777;margin-bottom:2px;text-transform:uppercase;">Billed To:</div>
        <div style="font-weight:800;font-size:11px;color:#111;">${q.billName || 'Customer Company Name'}</div>
        ${q.billContact ? `<div style="color:#444;font-size:9px;margin-top:1px;">Attn: ${q.billContact}</div>` : ''}
        <div style="margin-top:3px;color:#333;line-height:1.4;">${(q.billAddr || '').replace(/\n/g, '<br>')}</div>
        ${q.billState ? `<div style="margin-top:4px;font-weight:700;color:#1a3a1a;font-size:9px;">State: ${q.billState}</div>` : ''}
      </div>
      <div style="padding:8px 10px;">
        <div style="font-weight:700;font-size:9px;color:#777;margin-bottom:2px;text-transform:uppercase;">Shipped To:</div>
        <div style="font-weight:800;font-size:11px;color:#111;">${q.sameAsBill ? (q.billName || 'Customer Company Name') : (q.shipName || 'Target Logistics Hub')}</div>
        <div style="margin-top:3px;color:#333;line-height:1.4;">${q.sameAsBill ? (q.billAddr || '').replace(/\n/g, '<br>') : (q.shipAddr || '').replace(/\n/g, '<br>')}</div>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:11px;">
      <thead>
        <tr style="background:#f4f6f4;color:#1a3a1a;border-bottom:1px solid #ddd;">
          <th style="padding:6px;border-right:1px solid #ddd;width:25px;">Sr.</th>
          <th style="padding:6px;border-right:1px solid #ddd;text-align:left;width:110px;">Item</th>
          <th style="padding:6px;border-right:1px solid #ddd;text-align:left;">Specifications</th>
          <th style="padding:6px;border-right:1px solid #ddd;text-align:right;width:30px;">Qty</th>
          <th style="padding:6px;border-right:1px solid #ddd;text-align:right;width:70px;">Rate</th>
          <th style="padding:6px;text-align:right;width:80px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRowsHtml.length ? itemRowsHtml : `<tr><td colspan="6" style="text-align:center;padding:15px;color:#888;">No items configured</td></tr>`}
      </tbody>
    </table>

    <div class="grid-2 bordered" style="font-size:11px;border-top:1px solid #ddd;">
      <div style="padding:8px 10px;border-right:1px solid #ddd;display:flex;flex-direction:column;justify-content:space-between;">
        <div>
          <div style="font-weight:700;color:#1a3a1a;font-size:10px;">For Kuchhal Brothers</div>
          ${q.authSignature && q.authSignature.length > 20 ? `<img src="${q.authSignature}" style="max-height:100px;max-width:220px;object-fit:contain;display:block;margin:4px 0;" alt="Authorized Signature Stamp" />` : '<div style="height:80px;"></div>'}
          <div style="color:#aaa;font-size:9px;font-style:italic;">(Authorized Signatory)</div>
        </div>
      </div>
      <div style="padding:8px 10px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:10px;">
          <span style="color:#555;">Freight:</span><strong>${freightLabel}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:10px;">
          <span style="color:#555;">Installation:</span><strong>${instLabel}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;border-top:1px solid #eee;padding-top:3px;margin-top:3px;font-size:10px;">
          <span>Subtotal:</span><strong>${formatRupees(sub)}</strong>
        </div>
        ${taxBlockHtml}
      </div>
    </div>

    <div class="grid-2 bordered" style="font-size:11px;background:#fcfdfc;">
      <div style="padding:6px 10px;border-right:1px solid #ddd;">
        <div style="font-size:9px;color:#777;">Amount in Words:</div>
        <div style="color:#b30000;font-weight:700;font-size:10px;margin-top:1px;">${totalWords}</div>
      </div>
      <div style="padding:6px 10px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-weight:700;font-size:10px;">Grand Total</span>
        <strong style="font-size:14px;color:#1a3a1a;">${formatRupees(total)}</strong>
      </div>
    </div>

    <div style="padding:8px 10px;background:#fff;">
      <div style="font-size:9px;font-weight:700;color:#777;text-transform:uppercase;">Terms &amp; Specifics:</div>
      <div style="font-size:9px;color:#444;margin-top:2px;line-height:1.5;">
        &bull; Payment: ${q.payTerms || '—'} &nbsp;|&nbsp; &bull; Delivery: ${q.delivTime || '—'} &nbsp;|&nbsp; &bull; Warranty: ${q.warranty || '—'}
      </div>
    </div>

  </div>
</body>
</html>`;
}
