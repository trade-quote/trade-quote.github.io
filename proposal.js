// Shared proposal preview for the quote page and the hub: A4 pages in the job's brand accent.
// proposalBlocks() is pure (tested in Node); layoutProposal() needs a DOM. Expects optionPrices/quotePrice from the page.
const QP_CSS = `
.qp-wrap{--qp-accent:#1f2933;padding:14px 0 2px;background:#e9ecef;border-radius:8px}
.qp-slot{margin:0 auto 14px;overflow:hidden}
.qp-page{width:210mm;height:297mm;background:#fff;color:#1f2933;font:10pt/1.5 Arial,Helvetica,sans-serif;position:relative;display:flex;flex-direction:column;transform-origin:top left;box-shadow:0 2px 14px rgba(31,41,51,.18);overflow:hidden}
.qp-page *{box-sizing:border-box}
.qp-body{flex:1;min-height:0;overflow:hidden;padding:12mm 18mm 20mm}
.qp-foot{position:absolute;left:18mm;right:18mm;bottom:9mm;display:flex;justify-content:space-between;gap:6mm;font-size:7.5pt;color:#52606d;border-top:1px solid #e4e7eb;padding-top:2.5mm}
.qp-band{background:var(--qp-accent);color:#fff;min-height:62mm;padding:14mm 18mm 8mm;position:relative;flex:none;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.qp-band h1{color:#fff;font-size:26pt;line-height:1.1;margin:6mm 0 0;font-weight:700}
.qp-band .qp-addr{font-size:12pt;margin-top:3mm;opacity:.92}
.qp-band .qp-kicker{color:#fff;opacity:.85}
.qp-meta{display:flex;flex-wrap:wrap;gap:4mm 10mm;margin-top:8mm;font-size:8.5pt;opacity:.92}
.qp-meta b{display:block;font-size:9.5pt;font-weight:600}
.qp-kicker{font-size:8pt;letter-spacing:2.5px;text-transform:uppercase;color:#52606d}
.qp-rule{height:2px;width:22mm;background:var(--qp-accent);margin:3mm 0 4mm;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.qp-page h2{font-size:22pt;line-height:1.15;margin:0;font-weight:700}
.qp-letter{font-size:10.5pt;line-height:1.58;margin-bottom:6mm}
.qp-letter p{margin:0 0 3.6mm;white-space:pre-wrap}
.qp-opt{margin:0 0 7mm;break-inside:avoid}
.qp-opt-name{font-family:Georgia,serif;font-size:15pt;color:#1f2933;margin:1mm 0 0;line-height:1.2;font-weight:400}
.qp-opt-lead{margin:0 0 3mm;font-size:9.5pt;white-space:pre-wrap}
ul.qp-ticks{list-style:none;padding:0;margin:0 0 4mm;font-size:9pt}
ul.qp-ticks li{padding:0 0 1.8mm 5mm;position:relative}
ul.qp-ticks li:before{content:"";position:absolute;left:0;top:1.9mm;width:2mm;height:2mm;background:var(--qp-accent);border-radius:50%;print-color-adjust:exact;-webkit-print-color-adjust:exact}
table.qp-price{width:100%;border-collapse:collapse;font-size:9pt;min-width:0;margin:0}
table.qp-price td{padding:1.3mm 0;border-top:1px solid #e4e7eb;border-bottom:0;text-align:left}
table.qp-price td.r{text-align:right;white-space:nowrap}
table.qp-price .qp-sub td{color:#52606d}
table.qp-price .qp-tot td{font-weight:700;font-size:11pt;color:var(--qp-accent);border-top:2px solid var(--qp-accent);padding-top:2mm}
.qp-list h3{font-size:11.5pt;margin:4mm 0 2mm}
.qp-list ul{margin:0;padding-left:4.5mm;font-size:9pt}
.qp-list li{padding-bottom:1mm}
@media print{
 @page{size:A4;margin:0}
 .qp-slot{width:auto!important;height:auto!important;margin:0!important;overflow:visible!important}
 .qp-wrap{background:none!important;padding:0!important}
 .qp-page{transform:none!important;box-shadow:none;break-after:page}
 .qp-slot:last-child .qp-page{break-after:auto}
}`;

function qpEsc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function qpMoney(v) { return '$' + (Math.round(v * 100) / 100).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function qpBrand(job) {
  const b = (job && job.brand) || {};
  const accent = /^#[0-9a-fA-F]{6}$/.test(b.accent || '') ? b.accent : '#1f2933';
  const name = b.name || (job && job.entity) || 'Quote';
  return { name, accent, legal: b.legal || name };
}
function qpPriceTable(v, gst) {
  return gst
    ? `<table class="qp-price"><tbody><tr class="qp-sub"><td>Price ex GST</td><td class="r">${qpMoney(v.ex)}</td></tr><tr class="qp-sub"><td>GST</td><td class="r">${qpMoney(v.gst)}</td></tr><tr class="qp-tot"><td>Price inc GST</td><td class="r">${qpMoney(v.inc)}</td></tr></tbody></table>`
    : `<table class="qp-price"><tbody><tr class="qp-tot"><td>Price</td><td class="r">${qpMoney(v.ex)}</td></tr></tbody></table>`;
}
// Returns the cover plus an ordered list of blocks; each block stays whole on one page.
function proposalBlocks(p, job, today) {
  const brand = qpBrand(job), prices = optionPrices(p), f = quotePrice(p), gst = !!p.gst_registered;
  const meta = [['Date', today], ['Reference', job.quote_ref], ['Prepared by', p.prepared_by]].filter(([, v]) => v && String(v).trim());
  const cover = `<div class="qp-band"><div class="qp-kicker">${qpEsc(brand.name)} &middot; Quote</div><h1>${qpEsc(job.title)}</h1><div class="qp-addr">${qpEsc(job.site)}</div>`
    + `<div class="qp-meta">${meta.map(([k, v]) => `<div>${k}<b>${qpEsc(v)}</b></div>`).join('')}</div></div>`;
  const blocks = [];
  const letter = String(p.letter || '').trim();
  if (letter) blocks.push(`<div class="qp-letter">${letter.split(/\n\s*\n/).map(x => `<p>${qpEsc(x.trim())}</p>`).join('')}</div>`);
  (p.sections || []).forEach((s, i) => {
    const desc = String(s.description || '').trim(), points = (s.points || []).filter(x => String(x).trim());
    blocks.push(`<section class="qp-opt"><div class="qp-kicker">Option ${i + 1} &middot; ${qpEsc(s.tag)}</div><h3 class="qp-opt-name">${qpEsc(s.name)}</h3><div class="qp-rule"></div>`
      + (desc ? `<p class="qp-opt-lead">${qpEsc(desc)}</p>` : '')
      + (points.length ? `<ul class="qp-ticks">${points.map(x => `<li>${qpEsc(x)}</li>`).join('')}</ul>` : '')
      + qpPriceTable(prices[i], gst) + `</section>`);
  });
  const rows = (p.sections || []).map((s, i) => `<tr><td>Option ${i + 1}: ${qpEsc(s.name)} <span style="color:#52606d">(${qpEsc(s.tag)})</span></td><td class="r">${qpMoney(prices[i].ex)}${gst ? ' ex GST' : ''}</td></tr>`).join('');
  blocks.push(`<section class="qp-opt"><div class="qp-kicker">Summary</div><h2>Your investment</h2><div class="qp-rule"></div><table class="qp-price"><tbody>${rows}`
    + (gst ? `<tr class="qp-sub"><td>Total ex GST</td><td class="r">${qpMoney(f.ex)}</td></tr><tr class="qp-sub"><td>GST</td><td class="r">${qpMoney(f.gst)}</td></tr><tr class="qp-tot"><td>Total inc GST</td><td class="r">${qpMoney(f.inc)}</td></tr>`
           : `<tr class="qp-tot"><td>Total</td><td class="r">${qpMoney(f.ex)}</td></tr>`) + `</tbody></table></section>`);
  for (const [title, items] of [['Exclusions', p.exclusions], ['Assumptions', p.assumptions], ['Questions', p.questions], ['Terms and conditions', String(p.terms || '').split(/\r?\n/)]]) {
    const list = (items || []).filter(x => String(x).trim());
    // One block per item so a long list can break across pages; the heading travels with the first item.
    list.forEach((x, i) => blocks.push(`<div class="qp-list">${i === 0 ? `<h3>${title}</h3>` : ''}<ul><li>${qpEsc(x)}</li></ul></div>`));
  }
  return { brand, cover, blocks };
}
function proposalText(p, job, today) {
  const { cover, blocks } = proposalBlocks(p, job, today);
  return [cover, ...blocks].join('\n');
}
// Lays the blocks into A4 pages inside `wrap`, then scales them to the wrap width.
function layoutProposal(wrap, p, job) {
  if (!document.getElementById('qp-css')) { const st = document.createElement('style'); st.id = 'qp-css'; st.textContent = QP_CSS; document.head.appendChild(st); }
  const { brand, cover, blocks } = proposalBlocks(p, job, new Date().toLocaleDateString('en-AU'));
  wrap.className = 'qp-wrap'; wrap.style.setProperty('--qp-accent', brand.accent); wrap.innerHTML = '';
  const pages = [];
  const newPage = (first) => {
    const slot = document.createElement('div'); slot.className = 'qp-slot';
    const page = document.createElement('div'); page.className = 'qp-page';
    page.innerHTML = (first ? cover : '') + `<div class="qp-body"></div><div class="qp-foot"><span>${qpEsc(brand.legal)}</span><span class="qp-n"></span></div>`;
    slot.appendChild(page); wrap.appendChild(slot); pages.push(page); return page.querySelector('.qp-body');
  };
  let body = newPage(true);
  for (const html of blocks) {
    const holder = document.createElement('div'); holder.innerHTML = html; const el = holder.firstElementChild;
    body.appendChild(el);
    if (body.scrollHeight > body.clientHeight + 1 && body.children.length > 1) { el.remove(); body = newPage(false); body.appendChild(el); }
  }
  pages.forEach((pg, i) => { pg.querySelector('.qp-n').textContent = 'Page ' + (i + 1) + ' of ' + pages.length; });
  scaleProposal(wrap);
}
function scaleProposal(wrap) {
  const slots = wrap.querySelectorAll('.qp-slot'); if (!slots.length) return;
  const page = slots[0].firstElementChild, w = page.offsetWidth, h = page.offsetHeight;
  const s = Math.min(1, (wrap.clientWidth || w) / w);
  slots.forEach(slot => { slot.style.width = w * s + 'px'; slot.style.height = h * s + 'px'; slot.firstElementChild.style.transform = 'scale(' + s + ')'; });
}
if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('resize', () => document.querySelectorAll('.qp-wrap').forEach(scaleProposal));
