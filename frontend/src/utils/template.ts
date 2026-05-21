/**
 * Client-side real-time HTML compiler — pixel-perfect clone of backend PDF template.
 * Serves as the live preview iframe source in the QuotationEditor.
 */

export function formatRupees(amount: number): string {
  return (
    "₹" +
    amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return "—";
  try {
    const dt = new Date(dateString);
    if (isNaN(dt.getTime())) return dateString;
    return (
      String(dt.getDate()).padStart(2, "0") +
      "/" +
      String(dt.getMonth() + 1).padStart(2, "0") +
      "/" +
      dt.getFullYear()
    );
  } catch {
    return dateString;
  }
}

export function numberToWords(n: number): string {
  if (isNaN(n) || n === 0) return "Zero Rupees only";
  const a = [
    "",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ];
  const b = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];
  const iw = (num: number): string => {
    if (num < 20) return a[num];
    if (num < 100)
      return b[Math.floor(num / 10)] + (num % 10 ? " " + a[num % 10] : "");
    if (num < 1000)
      return (
        a[Math.floor(num / 100)] +
        " hundred" +
        (num % 100 ? " " + iw(num % 100) : "")
      );
    if (num < 100000)
      return (
        iw(Math.floor(num / 1000)) +
        " thousand" +
        (num % 1000 ? " " + iw(num % 1000) : "")
      );
    if (num < 10000000)
      return (
        iw(Math.floor(num / 100000)) +
        " lakh" +
        (num % 100000 ? " " + iw(num % 100000) : "")
      );
    return (
      iw(Math.floor(num / 10000000)) +
      " crore" +
      (num % 10000000 ? " " + iw(num % 10000000) : "")
    );
  };
  const parts = n.toFixed(2).split(".");
  const intPart = parseInt(parts[0], 10);
  const decPart = parseInt(parts[1], 10);
  let words = iw(intPart).trim();
  words = words.charAt(0).toUpperCase() + words.slice(1);
  if (decPart > 0) words += " and " + iw(decPart).trim() + " paise";
  return words + " only";
}

const KB = {
  addr: "982/1M, 983M Saleempur Rajputana Industrial Area\nRoorkee-247667, Uttarakhand",
  gstin: "05AWBPA1798G1ZS",
  phone: "+91 7017880914",
  email: "kuchhalbrothers@gmail.com",
  website: "www.sensormart.co.in",
  bank: {
    name: "Canara Bank",
    addr: "Maqtool Puri, Roorkee",
    ac: "2200261012427",
    ifsc: "CNRB0002200",
  },
  terms: [
    "Validity of Quote: 30 days",
    "Payments: 100% advance against PI",
    "Transit Insurance: extra @ 2% of invoice value if required",
    "All civil, Mechanical and Electrical works in customers account only",
    "PO shall be non-cancellable and non-returnable basis only",
    "Shipping will be done through DTDC courier by road basis",
  ],
};

// SVG icons (same as backend)
const ICON_PHONE = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`;
const ICON_EMAIL = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`;
const ICON_WEB = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`;

function iconBadge(icon: string, text: string) {
  return `<div style="display:flex;align-items:center;gap:6px;">
    <div style="background:#facc04;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#2c2a28;">${icon}</div>
    <span>${text}</span>
  </div>`;
}

export function generateLivePreviewHtml(q: any): string {
  const items = q.items || [];
  let sub = 0,
    taxSum = 0;
  items.forEach((item: any) => {
    const qty = parseFloat(item.qty || 1);
    const rate = parseFloat(item.rate || 0);
    const taxRate = parseFloat(item.tax || 18);
    const amt = qty * rate;
    sub += amt;
    taxSum += amt * (taxRate / 100);
  });

  const freightAmt = parseFloat(q.freightAmt || 0);
  const total = sub + taxSum + (q.freightType === "custom" ? freightAmt : 0);
  const totalWords = numberToWords(total);

  const freightLabel =
    q.freightType === "extra"
      ? "EXTRA"
      : q.freightType === "custom"
        ? formatRupees(freightAmt)
        : "Included";
  const instLabel = q.instType === "extra" ? "EXTRA" : "Included";

  // Logo: hardcoded to kb_logo.png
  const headerBrandingHtml = `<img src="/kb_logo.png" style="max-height:100px;max-width:200px;display:block;" alt="Company Logo" />`;

  const headerBarHtml = `
    <!-- Top Brand Header -->
    <div class="header-bar">
      <div style="padding:8px 7px 8px calc(16px + 8mm);">
        ${headerBrandingHtml}
      </div>
      <div style="background:#fff;color:#2c2a28;padding:12px calc(20px + 8mm) 8px 45px;width:max-content;flex-shrink:0;box-sizing:border-box;clip-path:polygon(40px 0,100% 0,100% 100%,0 100%);font-size:10px;font-weight:700;position:relative;">
        <div style="position:absolute;top:0;left:36px;right:1px;height:5px;background:#facc04;"></div>
        <div style="display:flex;justify-content:flex-end;align-items:center;gap:12px;flex-wrap:nowrap;white-space:nowrap;">
          ${iconBadge(ICON_PHONE, KB.phone)}
          ${iconBadge(ICON_EMAIL, KB.email)}
          ${iconBadge(ICON_WEB, KB.website)}
        </div>
      </div>
    </div>
  `;

  const itemRowsHtml = items
    .map((item: any, idx: number) => {
      const qty = parseFloat(item.qty || 1);
      const rate = parseFloat(item.rate || 0);
      const amt = qty * rate;
      const lines = (item.description || "").split("\n");
      const name = lines[0] || "";
      const specs = lines.slice(1).join("\n");
      const photoImg =
        item.photo && item.photo.length > 20
          ? `<img src="${item.photo}" style="width:90px;height:90px;object-fit:contain;display:block;margin:2px auto;border-radius:4px;" />`
          : "";
      const showPrice = !q.isDocComposite;

      return `
      <tr>
        <td style="padding:8px;border:1px solid #c8c8c8;text-align:center;font-size:11px;vertical-align:top;">${idx + 1}</td>
        <td style="padding:8px;border:1px solid #c8c8c8;vertical-align:top;">${photoImg}<div style="font-size:12px;font-weight:700;color:#111;margin-top:2px;text-align:center;">${name}</div></td>
        <td style="padding:8px;border:1px solid #c8c8c8;font-size:11px;white-space:pre-line;vertical-align:top;color:#333;line-height:1.4;">${specs}</td>
        ${q.isDocComposite
          ? `<td style="padding:8px;border:1px solid #c8c8c8;text-align:right;font-size:12px;vertical-align:top;">${qty}</td>`
          : `
        <td style="padding:8px;border:1px solid #c8c8c8;text-align:right;font-size:12px;vertical-align:top;">${qty}</td>
        <td style="padding:8px;border:1px solid #c8c8c8;text-align:right;font-size:12px;vertical-align:top;">${rate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        <td style="padding:8px;border:1px solid #c8c8c8;text-align:right;font-size:12px;font-weight:700;vertical-align:top;color:#111;">${amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        `
        }
      </tr>`;
    })
    .join("");

  const compositeSummaryHtml = q.isDocComposite
    ? `
    <tr style="background:#fcfdfc;font-weight:800;color:#1a3a1a;">
      <td colspan="3" style="padding:10px 12px;border:1px solid #c8c8c8;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">
        Items total cost for 1 set or bundle:
      </td>
      <td style="padding:10px 8px;border:1px solid #c8c8c8;text-align:right;font-size:13px;">${sub.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
    </tr>`
    : "";

  const taxBlockHtml =
    q.taxType === "igst"
      ? `<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px;"><span>CGST:</span><span>₹0.00</span></div>
       <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px;"><span>SGST:</span><span>₹0.00</span></div>
       <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px;"><span>IGST:</span><span style="color:#b30000;font-weight:700;">${formatRupees(taxSum)}</span></div>`
      : `<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px;"><span>CGST:</span><span>${formatRupees(taxSum / 2)}</span></div>
       <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px;"><span>SGST:</span><span>${formatRupees(taxSum / 2)}</span></div>
       <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px;"><span>IGST:</span><span>₹0.00</span></div>`;

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Quotation ${q.quoteNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&display=swap');
    @page {
      size: A4;
      margin: 8mm;
    }
    body { margin:0;padding:0;background:#fff;font-family:'DM Sans',Arial,sans-serif;color:#1a1a1a;-webkit-print-color-adjust:exact;print-color-adjust:exact; }
    .page { width:210mm;min-height:7mm;padding:8mm;box-sizing:border-box;margin:0 auto; }
    @media print {
      .page {
        width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
        min-height: 0 !important;
      }
    }
    .header-bar { background:#2c2a28;color:#fff;display:flex;justify-content:space-between;align-items:flex-end;margin-top:0mm;margin-left:0mm;margin-right:0mm;margin-bottom:0mm; }
    .bordered { border:1px solid #ccc;border-top:none; }
    .grid-2 { display:grid;grid-template-columns: 1fr 1fr; }
    .grid-4 { display:grid;grid-template-columns:1fr 1fr 1fr 1fr; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; break-inside: avoid; }
  </style>
</head>
<body>
  <div class="page">

    <!-- Table 1: Primary Document Contents (repeats headerBarHtml on page overflows natively) -->
    <table style="width:100%; border-collapse:collapse; border:none; margin:0; padding:0;">
      <thead>
        <tr>
          <td colspan="${q.isDocComposite ? 4 : 6}" style="border:none; padding:0;">
            ${headerBarHtml}
          </td>
        </tr>
      </thead>
      <tbody>
        <!-- Top contents block as a single spanning cell -->
        <tr>
          <td colspan="${q.isDocComposite ? 4 : 6}" style="border:none; padding:0; vertical-align:top;">
            <!-- Company Address & GSTIN -->
            <div class="bordered" style="padding:8px 14px;text-align:center;font-size:11px;font-weight:600;color:#333;">
              ${KB.addr.replace("\n", ", ")}
              <div style="font-weight:700;color:#1a3a1a;margin-top:2px;">GSTIN: ${KB.gstin}</div>
            </div>

            <!-- Banker Details Block (Centered) -->
            <div class="bordered" style="padding:8px 12px;text-align:center;">
              <div style="font-size:11px;font-weight:700;margin-bottom:3px;color:#111;">
                Banker Details: ${KB.bank.name}
              </div>
              <div style="font-size:10px;color:#555;line-height:1.6;">
                Address: ${KB.bank.addr} | A/C#: <strong>${KB.bank.ac}</strong> | IFSC: <strong>${KB.bank.ifsc}</strong>
              </div>
            </div>

            <!-- QUOTATION Title -->
            <div class="bordered" style="padding:10px 14px;text-align:center;font-size:20px;font-weight:900;letter-spacing:1.5px;color:#1a3a1a;">QUOTATION</div>

            <!-- Metadata Grid -->
            <div class="grid-4 bordered" style="font-size:11px;">
              <div style="padding:6px 10px;border-right:1px solid #ccc;">
                <div style="font-weight:700;color:#555;margin-bottom:2px;">Quote No</div>
                <strong style="color:#111;font-size:12px;">${q.quoteNumber || "—"}</strong>
              </div>
              <div style="padding:6px 10px;border-right:1px solid #ccc;">
                <div style="font-weight:700;color:#555;margin-bottom:2px;">Quote Date</div>
                <span style="color:#111;">${formatDate(q.quoteDate)}</span>
              </div>
              <div style="padding:6px 10px;border-right:1px solid #ccc;">
                <div style="font-weight:700;color:#555;margin-bottom:2px;">Transportation</div>
                <span style="color:#111;">${q.transport || "By road / Courier"}</span>
              </div>
              <div style="padding:6px 10px;">
                <div style="font-weight:700;color:#555;margin-bottom:2px;">Validity of Quote</div>
                <span style="color:#111;">${q.validTill ? formatDate(q.validTill) : "30 days"}</span>
              </div>
            </div>

            <!-- State / CustRef / Email / PayTerms row -->
            <div class="grid-2 bordered" style="font-size:11px;">
              <div style="padding:6px 10px;border-right:1px solid #ccc;">
                <span style="font-weight:700;color:#555;">State:</span> <strong style="color:#111;">${q.billState || "—"}</strong>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <span style="font-weight:700;color:#555;">State Code:</span> <strong style="color:#111;">${q.billStateCode || "—"}</strong>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <span style="font-weight:700;color:#555;">Customer Ref.:</span> <strong style="color:#111;">${q.custRef || "—"}</strong>
              </div>
              <div style="padding:6px 10px;">
                <span style="font-weight:700;color:#555;">Email:</span> <span style="color:#111;">${q.billEmail || "—"}</span>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <span style="font-weight:700;color:#555;">Payment Terms:</span> <strong style="color:#111;">${q.payTerms || "100% Advance"}</strong>
              </div>
            </div>

            <!-- Parties Details -->
            <div class="grid-2 bordered" style="font-size:11px;">
              <div style="padding:10px 12px;border-right:1px solid #ccc;">
                <div style="font-weight:700;margin-bottom:5px;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#777;">Details of Receiver | Billed to:</div>
                <div style="font-weight:800;font-size:13px;color:#111;">${q.billName || "Valued Customer"}</div>
                ${q.billContact ? `<div style="color:#444;margin-top:2px;">Attn: ${q.billContact}</div>` : ""}
                <div style="line-height:1.6;margin-top:4px;color:#333;">${(q.billAddr || "").replace(/\n/g, "<br>")}</div>
                ${q.billPhone ? `<div style="margin-top:4px;color:#444;">Ph: ${q.billPhone}</div>` : ""}
                ${q.billState || q.billStateCode ? `<div style="margin-top:6px;font-weight:700;color:#1a3a1a;background:#f9f9f9;padding:2px 4px;display:inline-block;border-radius:2px;">STATE: ${q.billState || "—"} &nbsp;|&nbsp; Code: ${q.billStateCode || "—"}</div>` : ""}
              </div>
              <div style="padding:10px 12px;">
                <div style="font-weight:700;margin-bottom:5px;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#777;">Details of Consignee | Shipped to:</div>
                <div style="font-weight:800;font-size:13px;color:#111;">${q.shipName || q.billName || "Valued Customer"}</div>
                ${q.shipContact ? `<div style="color:#444;margin-top:2px;">Attn: ${q.shipContact}</div>` : ""}
                <div style="line-height:1.6;margin-top:4px;color:#333;">${(q.shipAddr || q.billAddr || "").replace(/\n/g, "<br>")}</div>
                ${q.shipPhone ? `<div style="margin-top:4px;color:#444;">Ph: ${q.shipPhone}</div>` : ""}
                ${(() => {
      const st = q.shipState || q.billState;
      const sc = q.shipStateCode || q.billStateCode;
      return st || sc
        ? `<div style="margin-top:6px;font-weight:700;color:#1a3a1a;background:#f9f9f9;padding:2px 4px;display:inline-block;border-radius:2px;">STATE: ${st || "—"} &nbsp;|&nbsp; Code: ${sc || "—"}</div>`
        : "";
    })()}
              </div>
            </div>
          </td>
        </tr>

        <!-- Items Table Column Headers Row (rendered as direct table rows to let headers repeat properly) -->
        <tr style="background:#f4f6f4;color:#1a3a1a;">
          <th style="padding:8px;border:1px solid #c8c8c8;width:30px;text-align:center;">Sr.</th>
          <th style="padding:8px;border:1px solid #c8c8c8;text-align:left;width:180px;">Item / Photo</th>
          <th style="padding:8px;border:1px solid #c8c8c8;text-align:left;">Specifications</th>
          <th style="padding:8px;border:1px solid #c8c8c8;text-align:right;width:70px;">Qty</th>
          ${!q.isDocComposite ? `
          <th style="padding:8px;border:1px solid #c8c8c8;text-align:right;width:85px;">Rate (₹)</th>
          <th style="padding:8px;border:1px solid #c8c8c8;text-align:right;width:95px;">Amount (₹)</th>
          ` : ""}
        </tr>

        <!-- Item Rows and Composite Summary rendered directly inside the main table structure -->
        ${itemRowsHtml.length ? itemRowsHtml : `<tr><td colspan="${q.isDocComposite ? 4 : 6}" style="text-align:center;padding:15px;color:#888;">No items added to quotation</td></tr>`}
        ${compositeSummaryHtml}
      </tbody>
    </table>

    <!-- Force page break right after items table so that all financial details and signatures are on the next page -->
    <div style="page-break-before: always; break-before: page;"></div>

    <!-- Table 2: Financial Summary & Signatures / Terms -->
    <table style="width:100%; border-collapse:collapse; border:none; margin:0; padding:0;">
      <thead>
        <tr>
          <td style="border:none; padding:0;">
            ${headerBarHtml}
          </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border:none; padding:0; vertical-align:top;">
            <!-- Financial Summary Block -->
            <div class="grid-2 bordered" style="font-size:12px; border-top: 1px solid #ccc; page-break-inside: avoid; break-inside: avoid;">
              <div style="padding:10px 14px;border-right:1px solid #ccc;display:flex;flex-direction:column;justify-content:space-between;">
                <div>
                  <div style="font-weight:700;color:#1a3a1a;margin-bottom:8px;">For Kuchhal Brothers</div>
                  ${q.authSignature && q.authSignature.length > 20
      ? `<img src="${q.authSignature}" style="max-height:80px;max-width:200px;object-fit:contain;display:block;margin:6px 0;" alt="Authorized Signature" />`
      : `<div style="height:80px;display:flex;align-items:center;color:#aaa;font-size:11px;font-style:italic;">(Authorized Digital Output)</div>`
    }
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
                <div style="font-size:11px;font-weight:700;margin-top:8px;margin-bottom:3px;color:#555;">
                  Tax Calculation:
                </div>
                ${taxBlockHtml}
              </div>
            </div>

            <!-- Amount in Words & Final Total -->
            <div class="grid-2 bordered" style="font-size:11px; page-break-inside: avoid; break-inside: avoid;">
              <div style="padding:8px 12px;border-right:1px solid #ccc;">
                <div style="font-weight:700;color:#555;">Total Quote Amount in Words:</div>
                <div style="color:#b30000;font-weight:800;margin-top:3px;font-size:12px;">${totalWords}</div>
              </div>
              <div style="padding:8px 12px;display:flex;justify-content:space-between;align-items:center;background:#fcfdfc;">
                <div>
                  <div style="font-weight:800;color:#1a3a1a;font-size:12px;">Total Amount After Tax</div>
                  <div style="font-size:9px;color:#777;margin-top:2px;">Subject to Roorkee Jurisdiction. E &amp; O. E</div>
                </div>
                <div style="font-size:18px;font-weight:900;color:#1a3a1a;">${formatRupees(total)}</div>
              </div>
            </div>

            <!-- Terms and Conditions -->
            <div class="bordered" style="padding:12px 14px; page-break-inside: avoid; break-inside: avoid;">
              <div style="font-size:11px;font-weight:700;color:#1a3a1a;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.05em;">
                Terms &amp; Conditions of Quote:
              </div>
              <ol style="padding-left:16px;margin:0;font-size:11px;color:#444;line-height:1.8;">
                <li>${KB.terms[0]}</li>
                ${q.delivTime ? `<li><strong>Delivery Time:</strong> ${q.delivTime}</li>` : ""}
                ${q.warranty ? `<li><strong>Factory Warranty:</strong> ${q.warranty}${q.warrantyStart ? ` (Starting from ${q.warrantyStart})` : ""}</li>` : ""}
                ${KB.terms
      .slice(1)
      .map((t) => `<li>${t}</li>`)
      .join("")}
              </ol>
            </div>

            <!-- Bottom Footer -->
            <div style="background:#2c2a28;color:#fff;text-align:center;padding:8px 14px;font-size:10px;font-weight:700;border-radius:0 0 6px 6px;letter-spacing:0.5px;">
              982/1M, 983M, Salempur Rajputana Industrial Area, Roorkee-247667, Uttarakhand
            </div>
          </td>
        </tr>
      </tbody>
    </table>

  </div>
</body>
</html>`;
}
