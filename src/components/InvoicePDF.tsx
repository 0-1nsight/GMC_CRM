// ─── InvoicePDF.tsx ──────────────────────────────────────────────────────────
// Pure @react-pdf/renderer document — no DOM, no Tailwind.
// Used only for PDF generation; the visual UI lives in InvoiceView.tsx.
// ────────────────────────────────────────────────────────────────────────────

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// ── Asset imports (Vite) ──────────────────────────────────────────────────────
import logoUrl from '../assets/logo.png?url';
import sealUrl from '../assets/seal.png?url';
import sigUrl  from '../assets/sig.png?url';

// ── Palette ───────────────────────────────────────────────────────────────────
const NAVY   = '#003366';
const WHITE  = '#FFFFFF';
const GRAY50 = '#F9FAFB';
const GRAY100= '#F3F4F6';
const GRAY200= '#E5E7EB';
const GRAY400= '#9CA3AF';
const GRAY500= '#6B7280';
const GRAY700= '#374151';
const GRAY900= '#111827';
const BLUE100= '#DBEAFE';
const BLUE200= '#BFDBFE';
const RED50  = '#FFF5F5';
const RED600 = '#DC2626';
const RED700 = '#B91C1C';
const AMBER50= '#FFFBEB';
const AMBER800='#92400E';
const AMBER900='#78350F';

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: GRAY900,
    backgroundColor: WHITE,
    paddingBottom: 36,
  },

  // ── Header
  header: {
    backgroundColor: NAVY,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: WHITE,
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.3,
  },
  headerTagline: {
    color: BLUE200,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Oblique',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  logoBox: {
    backgroundColor: WHITE,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  logoImg: {
    width: 52,
    height: 28,
    objectFit: 'contain',
  },
  headerRule: {
    marginTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#93C5FD',
    opacity: 0.5,
  },

  // ── Meta (3-col grid)
  meta: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 10,
  },
  metaCol: { flex: 1 },
  metaLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: BLUE100,
    paddingBottom: 3,
    marginBottom: 6,
  },

  // Invoice details rows
  detailRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  detailKey: {
    width: 60,
    color: GRAY500,
    fontSize: 8,
  },
  detailVal: {
    flex: 1,
    fontFamily: 'Helvetica-Bold',
    color: GRAY900,
    fontSize: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 10,
    marginTop: 1,
  },
  statusDraft: { backgroundColor: '#FEF3C7', borderWidth: 0.5, borderColor: '#FCD34D' },
  statusPaid:  { backgroundColor: '#D1FAE5', borderWidth: 0.5, borderColor: '#6EE7B7' },
  statusOther: { backgroundColor: BLUE100,   borderWidth: 0.5, borderColor: '#93C5FD' },
  statusText: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  statusDraftText: { color: '#92400E' },
  statusPaidText:  { color: '#065F46' },
  statusOtherText: { color: '#1E40AF' },

  // Billed To
  billedName: { fontFamily: 'Helvetica-Bold', fontSize: 8.5, marginBottom: 3 },
  billedAddr: { fontSize: 7.5, color: GRAY500, lineHeight: 1.5 },

  // Service
  serviceDesc: { fontFamily: 'Helvetica-Bold', fontSize: 8.5, marginBottom: 6 },
  periodGrid: { flexDirection: 'row', gap: 6 },
  periodBox: {
    flex: 1,
    backgroundColor: GRAY50,
    borderRadius: 3,
    padding: 5,
  },
  periodBoxLabel: { fontSize: 7, color: GRAY500, marginBottom: 1.5 },
  periodBoxVal: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: GRAY900 },

  // ── Table
  tableWrapper: { paddingHorizontal: 24, paddingBottom: 4 },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    borderRadius: 2,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  thNum:   { width: 22, color: WHITE, fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', textAlign: 'center' },
  thDesc:  { flex: 1,   color: WHITE, fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', paddingLeft: 4 },
  thQty:   { width: 36, color: WHITE, fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', textAlign: 'center' },
  thPrice: { width: 66, color: WHITE, fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', textAlign: 'right' },
  thTotal: { width: 66, color: WHITE, fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', textAlign: 'right' },

  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: GRAY200,
  },
  tableRowEven: { backgroundColor: WHITE },
  tableRowOdd:  { backgroundColor: GRAY50 },
  tdNum:   { width: 22, color: GRAY400, fontSize: 7.5, textAlign: 'center', fontFamily: 'Courier' },
  tdDesc:  { flex: 1,   color: GRAY700, fontSize: 7.5, paddingLeft: 4 },
  tdQty:   { width: 36, color: GRAY900, fontSize: 7.5, textAlign: 'center', fontFamily: 'Helvetica-Bold' },
  tdPrice: { width: 66, color: GRAY700, fontSize: 7.5, textAlign: 'right' },
  tdTotal: { width: 66, color: GRAY900, fontSize: 7.5, textAlign: 'right', fontFamily: 'Helvetica-Bold' },

  // ── Totals + Signature
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 12,
  },

  // Signature block
  sigBlock: { width: 180 },
  sigInner: { position: 'relative', width: 170, height: 72 },
  sealImg: {
    position: 'absolute',
    width: 90,
    height: 90,
    top: 20,
    left: 20,
    opacity: 0.15,
  },
  sigImg: {
    position: 'absolute',
    width: 140,
    height: 58,
    bottom: -30,
    left: 0,
    objectFit: 'contain',
  },
  sigLine: {
    borderBottomWidth: 1.5,
    borderBottomColor: GRAY700,
    width: 165,
    marginBottom: 5,
  },
  sigTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: NAVY, textTransform: 'uppercase' },
  sigSub: { fontSize: 6.5, color: GRAY400, marginTop: 1.5 },

  // Totals box — widened to prevent subtitle/amount overlap
  totalsBox: {
    width: 240,
    borderRadius: 5,
    borderWidth: 0.5,
    borderColor: GRAY200,
    overflow: 'hidden',
    backgroundColor: GRAY50,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: GRAY200,
  },
  totalsLabel: { fontSize: 8, color: GRAY500 },
  totalsValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: GRAY900 },
  creditRow: { backgroundColor: RED50 },
  creditLabel: { fontSize: 8, color: RED700 },
  creditValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: RED600 },

  // Total due row — left side takes flex:1 so it never gets squeezed by the amount
  totalDueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: NAVY,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  totalDueLeft: {
    flex: 1,
    paddingRight: 10,
  },
  totalDueTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalDueSub: {
    fontSize: 6.5,
    color: BLUE200,
    marginTop: 2,
    marginRight: 12,
  },
  totalDueAmount: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    flexShrink: 0,
    minWidth: 60,
    textAlign: 'right',
  },

  // ── Notes
  notesWrapper: { paddingHorizontal: 24, paddingBottom: 10 },
  notesBox: {
    backgroundColor: AMBER50,
    borderWidth: 0.5,
    borderColor: '#FCD34D',
    borderRadius: 4,
    padding: 8,
  },
  notesTitle: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: AMBER800, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  notesText: { fontSize: 8, color: AMBER900 },

  // ── Footer
  footer: {
    flexDirection: 'row',
    gap: 24,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1.5,
    borderTopColor: GRAY100,
    backgroundColor: GRAY50,
    marginTop: 'auto',
  },
  footerCol: { flex: 1 },
  footerLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: BLUE100,
    paddingBottom: 3,
    marginBottom: 5,
  },
  footerRow: { flexDirection: 'row', marginBottom: 2.5 },
  footerKey: { fontSize: 7.5, color: GRAY500, width: 52 },
  footerVal: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: GRAY900, flex: 1 },
  footerEmail: { fontSize: 7.5, color: '#2563EB', flex: 1 },

  // ── Page number
  pageNum: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 7,
    color: GRAY400,
  },
  continuedBanner: {
    fontSize: 6.5,
    color: GRAY400,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 2,
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 });
}

function fmtDate(dateStr: string, opts: Intl.DateTimeFormatOptions) {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-US', opts);
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface InvoicePDFProps {
  invoice: any;
  items: any[];
  customerName: string | null;
  customerAddress: string | null;
  subtotal: number;
  gct: number;
  credit: number;
  finalTotal: number;
}

// ── Reusable totals + signature block ────────────────────────────────────────
function TotalsAndSignature({
  subtotal, gct, credit, finalTotal, invoice,
}: Pick<InvoicePDFProps, 'subtotal' | 'gct' | 'credit' | 'finalTotal' | 'invoice'>) {
  return (
    <View style={s.totalsSection}>
      {/* Signature */}
      <View style={s.sigBlock}>
        <View style={s.sigInner}>
          <Image src={sealUrl} style={s.sealImg} />
          <Image src={sigUrl}  style={s.sigImg}  />
        </View>
        <View style={s.sigLine} />
        <Text style={s.sigTitle}>Managing Director</Text>
        <Text style={s.sigSub}>Authorized Signature</Text>
      </View>

      {/* Totals box */}
      <View style={s.totalsBox}>
        <View style={s.totalsRow}>
          <Text style={s.totalsLabel}>Subtotal</Text>
          <Text style={s.totalsValue}>{fmt(subtotal)}</Text>
        </View>
        <View style={s.totalsRow}>
          <Text style={s.totalsLabel}>GCT (16.5%)</Text>
          <Text style={s.totalsValue}>{fmt(gct)}</Text>
        </View>
        {credit > 0 && (
          <View style={[s.totalsRow, s.creditRow]}>
            <Text style={s.creditLabel}>Credit Applied</Text>
            <Text style={s.creditValue}>-{fmt(credit)}</Text>
          </View>
        )}
        <View style={s.totalDueRow}>
          <View style={s.totalDueLeft}>
            <Text style={s.totalDueTitle}>Total Due</Text>
            <Text style={s.totalDueSub}>Payable to GMC Haulage Co. Ltd.</Text>
          </View>
          <Text style={s.totalDueAmount}>{fmt(finalTotal)}</Text>
        </View>
      </View>
    </View>
  );
}

// ── Reusable footer ───────────────────────────────────────────────────────────
function Footer() {
  return (
    <View style={s.footer}>
      <View style={s.footerCol}>
        <Text style={s.footerLabel}>Corporate Tax</Text>
        {[['Reg No', '104880'], ['TRN No', '002933136']].map(([k, v]) => (
          <View key={k} style={s.footerRow}>
            <Text style={s.footerKey}>{k}:</Text>
            <Text style={s.footerVal}>{v}</Text>
          </View>
        ))}
        <View style={s.footerRow}>
          <Text style={s.footerKey}>Email:</Text>
          <Text style={s.footerEmail}>info@gmchaulageltd.com</Text>
        </View>
      </View>
      <View style={s.footerCol}>
        <Text style={s.footerLabel}>Bank Transfer</Text>
        {[
          ['Bank',    'First Global (May Pen)'],
          ['Account', '991001002662'],
          ['Type',    'Business Savings'],
        ].map(([k, v]) => (
          <View key={k} style={s.footerRow}>
            <Text style={s.footerKey}>{k}:</Text>
            <Text style={s.footerVal}>{v}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function InvoicePDF({
  invoice,
  items,
  customerName,
  customerAddress,
  subtotal,
  gct,
  credit,
  finalTotal,
}: InvoicePDFProps) {
  const invoiceDate = new Date(invoice.date);
  const isValidDate = !isNaN(invoiceDate.getTime());

  const statusBadgeStyle =
    invoice.status === 'paid'  ? s.statusPaid  :
    invoice.status === 'draft' ? s.statusDraft : s.statusOther;
  const statusTextStyle =
    invoice.status === 'paid'  ? s.statusPaidText  :
    invoice.status === 'draft' ? s.statusDraftText : s.statusOtherText;

  const addressLines = (customerAddress || '').split(',').map((p: string) => p.trim()).filter(Boolean);

  // Split items across pages: first page fits ~18 rows, subsequent ~22
  const FIRST_PAGE_ROWS = 18;
  const OTHER_PAGE_ROWS = 22;
  const firstChunk = items.slice(0, FIRST_PAGE_ROWS);
  const remaining  = items.slice(FIRST_PAGE_ROWS);
  const extraPages: any[][] = [];
  for (let i = 0; i < remaining.length; i += OTHER_PAGE_ROWS) {
    extraPages.push(remaining.slice(i, i + OTHER_PAGE_ROWS));
  }
  const totalPages = 1 + extraPages.length;

  // Reusable table header row
  const TableHead = () => (
    <View style={s.tableHead}>
      <Text style={s.thNum}>#</Text>
      <Text style={s.thDesc}>Description</Text>
      <Text style={s.thQty}>Qty</Text>
      <Text style={s.thPrice}>Unit Price</Text>
      <Text style={s.thTotal}>Total</Text>
    </View>
  );

  // Reusable item rows
  const ItemRows = ({ rows, startIdx }: { rows: any[]; startIdx: number }) => (
    <>
      {rows.map((it, i) => {
        const idx = startIdx + i;
        return (
          <View key={it.id ?? idx} style={[s.tableRow, idx % 2 === 0 ? s.tableRowEven : s.tableRowOdd]}>
            <Text style={s.tdNum}>{idx + 1}</Text>
            <Text style={s.tdDesc}>{it.description}</Text>
            <Text style={s.tdQty}>{Number(it.quantity).toFixed(2)}</Text>
            <Text style={s.tdPrice}>{fmt(Number(it.unit_price))}</Text>
            <Text style={s.tdTotal}>{fmt(Number(it.total))}</Text>
          </View>
        );
      })}
    </>
  );

  return (
    <Document
      title={`Invoice ${invoice.invoice_number}`}
      author="GMC Haulage Co. Ltd."
      subject="Invoice"
    >
      {/* ══════════════════ PAGE 1 ══════════════════ */}
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <View>
              <Text style={s.headerTitle}>GMC Haulage Co. Ltd.</Text>
              <Text style={s.headerTagline}>"You Provide The Work — Let Us Do The Haul"</Text>
            </View>
            <View style={s.logoBox}>
              <Image src={logoUrl} style={s.logoImg} />
            </View>
          </View>
          <View style={s.headerRule} />
        </View>

        {/* Meta — 3 columns */}
        <View style={s.meta}>

          {/* Col 1 — Invoice Details */}
          <View style={s.metaCol}>
            <Text style={s.metaLabel}>Invoice Details</Text>
            {[
              ['Invoice No.', invoice.invoice_number],
              ['Issue Date',  isValidDate ? fmtDate(invoice.date, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'],
              ['Due Date',    invoice.due_date ? fmtDate(invoice.due_date, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'],
              ['Terms',       `${invoice.terms || '30'} Days Net`],
            ].map(([k, v]) => (
              <View key={k} style={s.detailRow}>
                <Text style={s.detailKey}>{k}:</Text>
                <Text style={s.detailVal}>{v}</Text>
              </View>
            ))}
            <View style={s.detailRow}>
              <Text style={s.detailKey}>Status:</Text>
              <View style={[s.statusBadge, statusBadgeStyle]}>
                <Text style={[s.statusText, statusTextStyle]}>{invoice.status || 'Pending'}</Text>
              </View>
            </View>
          </View>

          {/* Col 2 — Billed To */}
          <View style={s.metaCol}>
            <Text style={s.metaLabel}>Billed To</Text>
            <Text style={s.billedName}>{customerName || '—'}</Text>
            <View>
              {addressLines.map((line: string, i: number) => (
                <Text key={i} style={s.billedAddr}>{line}</Text>
              ))}
              <Text style={s.billedAddr}>{invoice.customer_country || 'Jamaica'}</Text>
            </View>
          </View>

          {/* Col 3 — Service */}
          <View style={s.metaCol}>
            <Text style={s.metaLabel}>Service</Text>
            <Text style={s.serviceDesc}>
              {invoice.service_description || 'Waste Management & Specialized Haulage'}
            </Text>
            <View style={s.periodGrid}>
              <View style={s.periodBox}>
                <Text style={s.periodBoxLabel}>Period</Text>
                <Text style={s.periodBoxVal}>
                  {isValidDate ? invoiceDate.toLocaleString('default', { month: 'long', year: 'numeric' }) : 'N/A'}
                </Text>
              </View>
              <View style={s.periodBox}>
                <Text style={s.periodBoxLabel}>Billing Date</Text>
                <Text style={s.periodBoxVal}>
                  {isValidDate ? fmtDate(invoice.date, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Table */}
        <View style={s.tableWrapper}>
          <TableHead />
          <ItemRows rows={firstChunk} startIdx={0} />
        </View>

        {/* Only show totals/footer on page 1 if everything fits on one page */}
        {extraPages.length === 0 && (
          <>
            <TotalsAndSignature
              subtotal={subtotal} gct={gct} credit={credit}
              finalTotal={finalTotal} invoice={invoice}
            />
            {invoice.notes && (
              <View style={s.notesWrapper}>
                <View style={s.notesBox}>
                  <Text style={s.notesTitle}>Notes</Text>
                  <Text style={s.notesText}>{invoice.notes}</Text>
                </View>
              </View>
            )}
            <Footer />
          </>
        )}

        <Text style={s.pageNum} render={({ pageNumber }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>

      {/* ══════════════════ OVERFLOW PAGES ══════════════════ */}
      {extraPages.map((chunk, pageIdx) => {
        const isLastPage = pageIdx === extraPages.length - 1;
        const startIdx   = FIRST_PAGE_ROWS + pageIdx * OTHER_PAGE_ROWS;

        return (
          <Page key={pageIdx} size="A4" style={s.page}>

            <Text style={s.continuedBanner}>(Continued from previous page)</Text>

            <View style={s.tableWrapper}>
              <TableHead />
              <ItemRows rows={chunk} startIdx={startIdx} />
            </View>

            {isLastPage && (
              <>
                <TotalsAndSignature
                  subtotal={subtotal} gct={gct} credit={credit}
                  finalTotal={finalTotal} invoice={invoice}
                />
                {invoice.notes && (
                  <View style={s.notesWrapper}>
                    <View style={s.notesBox}>
                      <Text style={s.notesTitle}>Notes</Text>
                      <Text style={s.notesText}>{invoice.notes}</Text>
                    </View>
                  </View>
                )}
                <Footer />
              </>
            )}

            <Text style={s.pageNum} render={({ pageNumber }) => `Page ${pageNumber} of ${totalPages}`} fixed />
          </Page>
        );
      })}
    </Document>
  );
}