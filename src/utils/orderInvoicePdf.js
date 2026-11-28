const escapeHtml = (val) =>
  String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const toRupees = (val, paiseVal) => {
  if (val !== undefined && val !== null && !Number.isNaN(Number(val))) {
    return Number(val);
  }
  if (paiseVal !== undefined && paiseVal !== null && !Number.isNaN(Number(paiseVal))) {
    return Number(paiseVal) / 100;
  }
  return 0;
};

export const printOrderInvoicePdf = (order, currentUser = null) => {
  if (!order) return false;

  const origin = window.location.origin;
  const logoUrl = `${origin}/logo-light.png`;

  const orderId = order.orderNumber || order.id || 'ORD-INVOICE';
  const placedDate = new Date(order.placedAt || order.createdAt || Date.now()).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const customerName =
    order.customerName ||
    order.patientName ||
    order.user?.fullName ||
    currentUser?.fullName ||
    currentUser?.name ||
    'Valued Customer';
  const customerPhone =
    order.customerPhone ||
    order.phone ||
    order.user?.phone ||
    currentUser?.phone ||
    '';
  const deliveryAddress =
    order.address ||
    order.deliveryAddress?.line1 ||
    [
      order.deliveryAddress?.street,
      order.deliveryAddress?.area,
      order.deliveryAddress?.city,
      order.deliveryAddress?.pincode,
    ]
      .filter(Boolean)
      .join(', ') ||
    'Registered Delivery Address';

  const pharmacyName =
    order.pharmacy?.name ||
    order.pharmacyName ||
    'Oshud Wala Licensed Partner Pharmacy';
  const pharmacyAddress =
    order.pharmacy?.address ||
    order.pharmacyAddress ||
    'West Bengal, India';
  const pharmacyPhone =
    order.pharmacy?.phone ||
    order.pharmacyPhone ||
    '';
  const pharmacyLicense =
    order.pharmacy?.licenseNumber ||
    order.pharmacy?.dlNumber ||
    '';

  const items = Array.isArray(order.items) ? order.items : [];

  const computedSubtotal = items.reduce((acc, item) => {
    const qty = Number(item.qty || item.quantity || 1);
    const unit = toRupees(item.price, item.unitPricePaise);
    const line = item.lineTotal !== undefined ? Number(item.lineTotal) : unit * qty;
    return acc + line;
  }, 0);

  const subtotal = toRupees(order.subtotal, order.subtotalPaise) || computedSubtotal;
  const deliveryFee = toRupees(order.deliveryFee, order.deliveryFeePaise);
  const discount = toRupees(order.discount, order.discountPaise);
  const grandTotal =
    toRupees(order.total, order.totalPaise) ||
    Math.max(0, subtotal + deliveryFee - discount);

  const paymentMethod = String(order.paymentMethod || 'COD').toUpperCase();
  const paymentStatus = String(
    order.paymentStatus || (order.status === 'DELIVERED' ? 'PAID' : 'PENDING')
  ).toUpperCase();
  const orderStatus = String(order.status || 'CONFIRMED').replace(/_/g, ' ');

  const rowsHtml =
    items.length > 0
      ? items
          .map((item, index) => {
            const name = item.name || item.nameSnapshot || 'Medicine Item';
            const dosage = item.dosage || item.strength || '';
            const batch = item.batchNumber || item.batch || '—';
            const typeTag = item.requiresPrescription ? 'Rx' : 'OTC';
            const qty = Number(item.qty || item.quantity || 1);
            const unitPrice = toRupees(item.price, item.unitPricePaise);
            const lineTotal = item.lineTotal !== undefined ? Number(item.lineTotal) : unitPrice * qty;

            return `
              <tr>
                <td class="num">${index + 1}</td>
                <td>
                  <div class="item-name">${escapeHtml(name)} <span class="tag">${typeTag}</span></div>
                  ${dosage ? `<div class="item-sub">${escapeHtml(dosage)}</div>` : ''}
                </td>
                <td class="mono">${escapeHtml(batch)}</td>
                <td class="num">${qty}</td>
                <td class="num mono">₹${unitPrice.toFixed(2)}</td>
                <td class="num mono bold">₹${lineTotal.toFixed(2)}</td>
              </tr>
            `;
          })
          .join('')
      : `
        <tr>
          <td colspan="6" style="text-align:center;padding:18px;color:#64748b;">
            Verified Medicine Package (${escapeHtml(orderId)})
          </td>
        </tr>
      `;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Oshud Wala Invoice - ${escapeHtml(orderId)}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 12px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet { max-width: 780px; margin: 0 auto; border: 1px solid #d1fae5; border-radius: 14px; overflow: hidden; }
    .header {
      background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
      color: #ffffff;
      padding: 22px 26px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .logo-wrap { background: #ffffff; padding: 7px 12px; border-radius: 10px; display: inline-flex; align-items: center; }
    .logo-wrap img { height: 32px; width: auto; display: block; }
    .brand-sub { font-size: 11px; color: #a7f3d0; margin-top: 4px; }
    .invoice-meta { text-align: right; }
    .invoice-title { font-size: 18px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; color: #ecfdf5; }
    .invoice-id { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; font-weight: 700; color: #6ee7b7; margin-top: 2px; }
    .invoice-date { font-size: 11px; color: #d1fae5; margin-top: 2px; }
    .body { padding: 22px 26px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; }
    .card-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #047857; margin-bottom: 5px; }
    .card-title { font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 3px; }
    .card-text { font-size: 11.5px; color: #475569; }
    .meta-strip {
      display: flex; flex-wrap: wrap; gap: 16px;
      background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px;
      padding: 10px 14px; margin-bottom: 18px; font-size: 11.5px;
    }
    .meta-strip div strong { color: #064e3b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
    thead th {
      background: #064e3b; color: #ffffff; font-size: 10.5px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.05em; padding: 9px 10px; text-align: left;
    }
    thead th.num { text-align: right; }
    tbody td { padding: 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; font-size: 11.5px; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    td.num { text-align: right; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .bold { font-weight: 700; color: #064e3b; }
    .item-name { font-weight: 700; color: #0f172a; }
    .item-sub { font-size: 10.5px; color: #64748b; }
    .tag {
      display: inline-block; font-size: 9px; font-weight: 800; padding: 1px 5px;
      border-radius: 4px; background: #d1fae5; color: #065f46; margin-left: 4px; vertical-align: middle;
    }
    .totals-wrap { display: flex; justify-content: flex-end; margin-bottom: 20px; }
    .totals-box { width: 270px; border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden; }
    .tot-row { display: flex; justify-content: space-between; padding: 7px 12px; font-size: 11.5px; border-bottom: 1px solid #e2e8f0; }
    .tot-row:last-child { border-bottom: none; }
    .tot-grand { background: #064e3b; color: #ffffff; font-size: 13.5px; font-weight: 800; padding: 10px 12px; }
    .footer {
      border-top: 1px dashed #cbd5e1; padding-top: 14px;
      display: flex; justify-content: space-between; align-items: flex-end; gap: 16px;
      font-size: 10.5px; color: #64748b;
    }
    .sign-box { text-align: right; }
    .sign-line { font-weight: 700; color: #064e3b; margin-bottom: 2px; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <div class="logo-wrap"><img src="${logoUrl}" alt="Oshud Wala" /></div>
        <div class="brand-sub">Trusted Online Pharmacy &amp; Healthcare Delivery • oshudwala.in</div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-title">Order Invoice</div>
        <div class="invoice-id">#${escapeHtml(orderId)}</div>
        <div class="invoice-date">Date: ${escapeHtml(placedDate)}</div>
      </div>
    </div>
    <div class="body">
      <div class="meta-strip">
        <div><strong>Order Status:</strong> ${escapeHtml(orderStatus)}</div>
        <div><strong>Payment Mode:</strong> ${escapeHtml(paymentMethod)}</div>
        <div><strong>Payment Status:</strong> ${escapeHtml(paymentStatus)}</div>
      </div>
      <div class="grid-2">
        <div class="card">
          <div class="card-label">Billed &amp; Delivered To</div>
          <div class="card-title">${escapeHtml(customerName)}</div>
          ${customerPhone ? `<div class="card-text">Phone: ${escapeHtml(customerPhone)}</div>` : ''}
          <div class="card-text">${escapeHtml(deliveryAddress)}</div>
        </div>
        <div class="card">
          <div class="card-label">Fulfilled By Partner Pharmacy</div>
          <div class="card-title">${escapeHtml(pharmacyName)}</div>
          <div class="card-text">${escapeHtml(pharmacyAddress)}</div>
          ${pharmacyPhone ? `<div class="card-text">Phone: ${escapeHtml(pharmacyPhone)}</div>` : ''}
          ${pharmacyLicense ? `<div class="card-text">Drug License: ${escapeHtml(pharmacyLicense)}</div>` : ''}
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th class="num" style="width:38px;">#</th>
            <th>Medicine / Product Description</th>
            <th style="width:95px;">Batch</th>
            <th class="num" style="width:55px;">Qty</th>
            <th class="num" style="width:90px;">Unit Price</th>
            <th class="num" style="width:95px;">Amount</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div class="totals-wrap">
        <div class="totals-box">
          <div class="tot-row"><span>Item Subtotal</span><span class="mono">₹${subtotal.toFixed(2)}</span></div>
          <div class="tot-row"><span>Delivery Charges</span><span class="mono">${deliveryFee > 0 ? `₹${deliveryFee.toFixed(2)}` : 'FREE'}</span></div>
          ${discount > 0 ? `<div class="tot-row" style="color:#047857;"><span>Discount Applied</span><span class="mono">-₹${discount.toFixed(2)}</span></div>` : ''}
          <div class="tot-row tot-grand"><span>Grand Total</span><span class="mono">₹${grandTotal.toFixed(2)}</span></div>
        </div>
      </div>
      <div class="footer">
        <div>
          <strong>Declaration:</strong> Medicines dispensed against valid prescription where applicable.<br />
          This is a computer-generated invoice from <strong>Oshud Wala</strong> and does not require a physical signature.
        </div>
        <div class="sign-box">
          <div class="sign-line">Oshud Wala Healthcare</div>
          <div>Thank you for trusting us with your health!</div>
        </div>
      </div>
    </div>
  </div>
  <script>
    window.onload = function () {
      setTimeout(function () { window.focus(); window.print(); }, 300);
    };
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=900,height=750');
  if (!printWindow) return false;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  return true;
};

export default printOrderInvoicePdf;
