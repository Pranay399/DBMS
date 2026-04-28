import React, { useState, useCallback } from 'react';
import axios from 'axios';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import MyBookingsPage from './pages/MyBookingsPage';
import AdminPage from './pages/AdminPage';

const API = 'http://localhost:5000';

// ─── Query Definitions (used by SqlExplorer) ─────────────────────────────────
export const QUERIES = [
  { id: 1, part: 'A', title: 'Confirmed Tickets Full Detail', desc: 'Passenger name, train, source & destination for all confirmed tickets via multi-table JOIN.', badge: 'JOIN', badgeClass: 'badge-join' },
  { id: 2, part: 'A', title: 'Users & Total Bookings', desc: 'All users and booking count including users with 0 bookings using LEFT JOIN.', badge: 'JOIN', badgeClass: 'badge-join' },
  { id: 3, part: 'A', title: 'Refunded Payments Detail', desc: 'Refunded payments with user name and refund percentage across 4 tables.', badge: 'JOIN', badgeClass: 'badge-join' },
  { id: 4, part: 'A', title: 'Seat Type Per Ticket (CASE)', desc: 'Exact berth type (Upper/Middle/Lower) for each ticket using CASE + LEFT JOINs on subclass tables.', badge: 'JOIN', badgeClass: 'badge-join' },
  { id: 5, part: 'A', title: 'Admins & Departments', desc: 'Admin details with their department joined from the base USER table.', badge: 'JOIN', badgeClass: 'badge-join' },
  { id: 6, part: 'B', title: "Passengers from 'New York' (IN)", desc: 'Find users who booked trains departing from New York using a correlated IN subquery.', badge: 'SUBQUERY', badgeClass: 'badge-sub' },
  { id: 7, part: 'B', title: 'Trains with No Schedules (NOT EXISTS)', desc: 'Trains that have no scheduled trips using the NOT EXISTS predicate.', badge: 'SUBQUERY', badgeClass: 'badge-sub' },
  { id: 8, part: 'B', title: 'Maximum Payment (ALL)', desc: 'The payment record with the highest amount using the ALL comparison operator.', badge: 'SUBQUERY', badgeClass: 'badge-sub' },
  { id: 9, part: 'B', title: 'Stripe Gateway Tickets', desc: "Tickets linked to payments made via the 'Stripe' online gateway.", badge: 'SUBQUERY', badgeClass: 'badge-sub' },
  { id: 10, part: 'B', title: 'Above-Average Age Passengers', desc: 'Passengers older than the average age of all passengers using scalar subquery.', badge: 'SUBQUERY', badgeClass: 'badge-sub' },
  { id: 11, part: 'C', title: 'Latest Booking Per User', desc: "Each user's most recent booking using a correlated MAX subquery.", badge: 'CORRELATED', badgeClass: 'badge-corr' },
  { id: 12, part: 'C', title: 'Coaches with More Than 2 Seats', desc: 'Coaches exceeding 2 seats using a correlated COUNT subquery.', badge: 'CORRELATED', badgeClass: 'badge-corr' },
  { id: 13, part: 'C', title: 'High-Revenue Trains (>$100)', desc: 'Trains where total payment collected exceeds $100 using correlated SUM.', badge: 'CORRELATED', badgeClass: 'badge-corr' },
  { id: 14, part: 'C', title: 'Users with Cancelled Tickets (EXISTS)', desc: 'Users who have at least one cancelled ticket using the EXISTS predicate.', badge: 'CORRELATED', badgeClass: 'badge-corr' },
  { id: 15, part: 'C', title: 'Tickets on Earliest Departure', desc: 'Tickets belonging to the earliest scheduled departure time using ORDER BY + LIMIT subquery.', badge: 'CORRELATED', badgeClass: 'badge-corr' },
  { id: 16, part: 'D', title: 'Revenue by Payment Method', desc: 'Total revenue grouped and summed by each payment method (GROUP BY + SUM).', badge: 'AGGREGATION', badgeClass: 'badge-agg' },
  { id: 17, part: 'D', title: 'Confirmed vs Waitlisted Per Train', desc: 'Count of confirmed and waitlisted tickets per train using conditional SUM (CASE WHEN).', badge: 'AGGREGATION', badgeClass: 'badge-agg' },
  { id: 18, part: 'D', title: 'Big Spenders (HAVING > $200)', desc: 'Users who have spent more than $200 in total using GROUP BY + HAVING.', badge: 'AGGREGATION', badgeClass: 'badge-agg' },
  { id: 19, part: 'D', title: 'Average Ticket Cost Per Train', desc: 'Average payment amount per train using AVG aggregate function.', badge: 'AGGREGATION', badgeClass: 'badge-agg' },
  { id: 20, part: 'D', title: 'Most Popular Coach Type', desc: 'The coach type with the most passengers using COUNT + GROUP BY + ORDER BY + LIMIT.', badge: 'AGGREGATION', badgeClass: 'badge-agg' },
  { id: 21, part: 'E', title: 'Train Booking Rankings (RANK)', desc: 'Trains ranked by total number of bookings using RANK() OVER window function.', badge: 'WINDOW', badgeClass: 'badge-win' },
  { id: 22, part: 'E', title: 'Running Revenue Total (SUM OVER)', desc: 'Cumulative sum of revenue over sequential payment IDs using SUM() OVER().', badge: 'WINDOW', badgeClass: 'badge-win' },
  { id: 23, part: 'E', title: 'Ticket Row Numbers (ROW_NUMBER)', desc: 'Tickets numbered alphabetically by passenger name using ROW_NUMBER() OVER().', badge: 'WINDOW', badgeClass: 'badge-win' },
  { id: 24, part: 'E', title: 'Max Spend Per User (PARTITION BY)', desc: "Each user's maximum single payment using MAX() OVER(PARTITION BY user_id).", badge: 'WINDOW', badgeClass: 'badge-win' },
  { id: 25, part: 'E', title: 'Next Departure Time (LEAD)', desc: 'Next departure time for each train schedule using LEAD() OVER window function.', badge: 'WINDOW', badgeClass: 'badge-win' },
  { id: 26, part: 'F', title: 'Cancellation Rate CTE', desc: 'Calculate the percentage of cancelled tickets using a WITH CTE.', badge: 'CTE', badgeClass: 'badge-cte' },
  { id: 27, part: 'F', title: 'AC Coach Seat Counts CTE', desc: 'Filter AC coaches and count seats using a named CTE.', badge: 'CTE', badgeClass: 'badge-cte' },
  { id: 28, part: 'F', title: 'Net Profit Report (Multi-CTE)', desc: 'Revenue vs Refunds net profit using two separate CTEs in one query.', badge: 'CTE', badgeClass: 'badge-cte' },
  { id: 29, part: 'F', title: 'Recursive Number Generator', desc: 'Generate sequential numbers up to the ticket count using WITH RECURSIVE.', badge: 'CTE', badgeClass: 'badge-cte' },
  { id: 30, part: 'F', title: 'Frequent Travelers CTE', desc: 'Users with more than one booking using a CTE with HAVING filter.', badge: 'CTE', badgeClass: 'badge-cte' },
  { id: 31, part: 'G', title: 'PassengerManifest View (CREATE)', desc: 'Create and query a flattened view combining ticket, train, schedule, and coach data.', badge: 'VIEW', badgeClass: 'badge-view' },
  { id: 32, part: 'G', title: "PassengerManifest — 'Express 101'", desc: "Query the PassengerManifest view filtered for 'Express 101' train.", badge: 'VIEW', badgeClass: 'badge-view' },
  { id: 33, part: 'G', title: 'RevenueDashboard View (CREATE)', desc: 'Create and query a revenue aggregation view per train for completed payments.', badge: 'VIEW', badgeClass: 'badge-view' },
  { id: 34, part: 'G', title: 'RevenueDashboard — Top Trains', desc: 'Query the RevenueDashboard view ordered by highest revenue.', badge: 'VIEW', badgeClass: 'badge-view' },
  { id: 35, part: 'G', title: 'UpcomingTrains View (CREATE)', desc: 'Create and query a view returning all trains with future departure times.', badge: 'VIEW', badgeClass: 'badge-view' },
  { id: 36, part: 'H', title: 'GetAgeCategory Function', desc: 'Create a deterministic function that categorizes passenger age (Minor/Adult/Senior) and call it.', badge: 'PROCEDURE', badgeClass: 'badge-proc' },
  { id: 37, part: 'H', title: 'ProcessRefund Procedure', desc: 'Stored procedure with a full TRANSACTION to update payment status and log a refund.', badge: 'PROCEDURE', badgeClass: 'badge-proc' },
  { id: 38, part: 'H', title: 'GetBookedSeats Procedure', desc: 'Stored procedure that accepts train_id and returns all occupied seats with coach type.', badge: 'PROCEDURE', badgeClass: 'badge-proc' },
  { id: 39, part: 'H', title: 'Age Category Function Call', desc: 'Execute the GetAgeCategory function across all passengers to display their category.', badge: 'PROCEDURE', badgeClass: 'badge-proc' },
  { id: 40, part: 'I', title: 'Payment Guard Trigger', desc: 'BEFORE INSERT trigger on payment that rejects any negative amount with SIGNAL SQLSTATE.', badge: 'TRIGGER', badgeClass: 'badge-trg' },
  { id: 41, part: 'I', title: 'Cancellation Audit Trigger', desc: 'AFTER INSERT trigger on cancellation that logs payment_id to an audit table.', badge: 'TRIGGER', badgeClass: 'badge-trg' },
  { id: 42, part: 'I', title: 'All DB Triggers (INFORMATION_SCHEMA)', desc: 'List all registered triggers in the database using INFORMATION_SCHEMA.TRIGGERS.', badge: 'TRIGGER', badgeClass: 'badge-trg' },
  { id: 43, part: 'J', title: 'User Travel Diversity (CTE + DENSE_RANK)', desc: 'Rank users by the number of unique trains they have travelled on using a CTE and DENSE_RANK().', badge: 'ADVANCED', badgeClass: 'badge-adv' },
  { id: 44, part: 'J', title: 'Top Payment Method (CTE + RANK)', desc: 'Most preferred payment method (excluding refunds) using a CTE combined with RANK() OVER.', badge: 'ADVANCED', badgeClass: 'badge-adv' },
  { id: 45, part: 'J', title: 'Avg Passenger Age Per Admin Dept', desc: 'Multi-level JOIN finding the average passenger age each admin department has processed.', badge: 'ADVANCED', badgeClass: 'badge-adv' },
  { id: 46, part: 'K', title: 'Monthly Revenue Analytics', desc: 'Aggregated revenue grouped by month to analyze financial trends.', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 47, part: 'K', title: 'Busy Station Arrivals', desc: 'Identify which stations receive the most incoming train traffic.', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 48, part: 'K', title: 'Universal Coach Travelers', desc: 'Relational division: users who have booked seats in every available coach type.', badge: 'RELATIONAL', badgeClass: 'badge-adv' },
  { id: 49, part: 'K', title: 'High Occupancy Trains', desc: 'Trains with total bookings higher than the system-wide average occupancy.', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 50, part: 'K', title: 'Average Journey Duration', desc: 'Calculate the average time spent on journeys per train in minutes.', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 51, part: 'K', title: 'Revenue by Age Group', desc: 'Financial breakdown by age category (Minor/Adult/Senior) using GetAgeCategory.', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 52, part: 'K', title: 'Top 5 Power Users', desc: 'Identify the most frequent travelers by total booking count.', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 53, part: 'K', title: 'Train Refund Rates', desc: 'Rank trains by the percentage of payments that resulted in a refund.', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 54, part: 'K', title: 'Coach Seat Availability', desc: 'Real-time report of total vs booked seats for every coach in the system.', badge: 'REPORT', badgeClass: 'badge-view' },
  { id: 55, part: 'K', title: 'Zero Cancellation Users', desc: 'Find users who have never cancelled a single ticket in their history.', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 56, part: 'K', title: 'Dept Revenue Performance', desc: 'Simulated cross-analysis of revenue generation per admin department.', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 57, part: 'K', title: 'Common Passenger Names', desc: 'Frequency analysis of passenger names (potential family/group patterns).', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 58, part: 'K', title: 'Avg Price per Coach Type', desc: 'Compare average booking costs across different coach classes.', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 59, part: 'K', title: 'Schedule Conflict Audit', desc: 'Identify instances where a train has overlapping departure/arrival times.', badge: 'AUDIT', badgeClass: 'badge-trg' },
  { id: 60, part: 'K', title: 'Third-Party Bookings', desc: 'Users who booked tickets for passengers with different names.', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 61, part: 'K', title: 'Coach Revenue Rankings', desc: 'Rank individual coaches by the total revenue they have generated using RANK().', badge: 'WINDOW', badgeClass: 'badge-win' },
  { id: 62, part: 'K', title: 'Highest Value Ticket', desc: 'Identify the single most expensive payment recorded in the system.', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 63, part: 'K', title: 'AC vs Non-AC Ratio', desc: 'Percentage distribution of bookings between AC and standard classes.', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 64, part: 'K', title: 'Fully Occupied Trains', desc: 'Identify trains where every single seat has been booked.', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 65, part: 'K', title: 'Multi-Method Payment Users', desc: 'Users who have utilized more than one distinct payment method.', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 66, part: 'K', title: 'Average Booking Lead Time', desc: 'The average number of hours between booking creation and train departure.', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 67, part: 'K', title: 'MoM Revenue Growth', desc: 'Calculate month-over-month revenue growth using the LAG() window function.', badge: 'WINDOW', badgeClass: 'badge-win' },
  { id: 68, part: 'K', title: 'Peak Booking Hours', desc: 'Hourly distribution of booking activity to identify peak system usage.', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 69, part: 'K', title: 'Multi-Source Trains', desc: 'Trains that operate from more than two distinct source cities.', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 70, part: 'K', title: 'Non-AC Loyalists', desc: 'Users who have booked journeys but have never once used an AC coach.', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 71, part: 'K', title: 'Ghost Train Report', desc: 'Identify trains that have zero bookings recorded against them.', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 72, part: 'K', title: 'Avg Age per Train', desc: 'Demographic analysis: average age of passengers on each train.', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 73, part: 'K', title: 'Seat Revenue Efficiency', desc: 'Revenue generated per individual physical seat in the system.', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 74, part: 'K', title: 'Repeat Train Travelers', desc: 'Identify users who have travelled on the exact same train more than once.', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 75, part: 'K', title: 'Longest Journey Duration', desc: 'Identify the train with the highest total travel time in minutes.', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 76, part: 'K', title: 'High-Value Gateways', desc: 'Payment gateways preferred for high-value transactions (>$150).', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 77, part: 'K', title: 'Active Passengers (Last 7d)', desc: 'Users who have made at least one booking in the last week.', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 78, part: 'K', title: 'Total Cancellation Fees', desc: 'Sum of all cancellation fees collected from refunded tickets.', badge: 'FINANCE', badgeClass: 'badge-view' },
  { id: 79, part: 'K', title: 'Destination Popularity Rank', desc: 'Rank all destination cities by total incoming booking volume.', badge: 'WINDOW', badgeClass: 'badge-win' },
  { id: 80, part: 'K', title: 'Bulk Booking Detection', desc: 'Identify single bookings that contain multiple passenger tickets.', badge: 'AUDIT', badgeClass: 'badge-view' },
  { id: 81, part: 'K', title: 'Gateway Refund Averages', desc: 'The average amount refunded back through each specific gateway.', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 82, part: 'K', title: 'Super Admin Users', desc: 'Identify all admins with the highest system access level.', badge: 'SECURITY', badgeClass: 'badge-view' },
  { id: 83, part: 'K', title: 'Next 24-Hour Schedules', desc: 'Real-time list of all trains departing within the next 24 hours.', badge: 'OPERATIONS', badgeClass: 'badge-view' },
  { id: 84, part: 'K', title: 'Dominant Gender Demographic', desc: 'The most common gender represented in the passenger database.', badge: 'ANALYTIC', badgeClass: 'badge-view' },
  { id: 85, part: 'K', title: 'System Longevity', desc: 'Number of days elapsed since the first user registration (Uptime simulation).', badge: 'ANALYTIC', badgeClass: 'badge-view' },
];

export const PARTS = [
  { id: 'A', label: 'Complex JOINs', icon: '🔗', badge: '5' },
  { id: 'B', label: 'Subqueries', icon: '🔍', badge: '5' },
  { id: 'C', label: 'Correlated Subqueries', icon: '🔄', badge: '5' },
  { id: 'D', label: 'Aggregation', icon: '📊', badge: '5' },
  { id: 'E', label: 'Window Functions', icon: '🪟', badge: '5' },
  { id: 'F', label: 'CTEs', icon: '🌿', badge: '5' },
  { id: 'G', label: 'Views', icon: '👁️', badge: '5' },
  { id: 'H', label: 'Stored Procedures', icon: '⚙️', badge: '4' },
  { id: 'I', label: 'Triggers', icon: '⚡', badge: '3' },
  { id: 'J', label: 'Advanced Combos', icon: '🚀', badge: '3' },
  { id: 'K', label: 'Analytics Library', icon: '📊', badge: '40' },
];

export const PART_TITLES = {
  A: 'Part A — Complex JOINs', B: 'Part B — Subqueries', C: 'Part C — Correlated Subqueries',
  D: 'Part D — Aggregation & Grouping', E: 'Part E — Window Functions',
  F: 'Part F — CTEs', G: 'Part G — Views', H: 'Part H — Stored Procedures',
  I: 'Part I — Triggers', J: 'Part J — Advanced Combinations',
  K: 'Part K — Analytics & BI Reports',
};

function fmtValue(key, val) {
  if (val === null || val === undefined) return <span style={{ color: '#475569' }}>NULL</span>;
  const k = key.toLowerCase(), s = String(val);
  if (k.includes('amount') || k.includes('revenue') || k.includes('profit') || k.includes('incoming') || k.includes('outgoing') || (k.includes('total') && k.includes('rev')))
    return <span className="td-money">${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
  if (k === 'rnk' || k === 'row_num' || k === 'diversity_rank' || k === 'popularity_rank')
    return <span className="td-rank">#{s}</span>;
  if (k.includes('_id') || k.includes('count') || k.includes('cnt') || k === 'age' || k === 'value' || k === 'unique_trains')
    return <span className="td-num">{s}</span>;
  return s;
}

export function QueryCard({ q }) {
  const [state, setState] = useState('idle');
  const [data, setData] = useState(null);
  const [errMsg, setErrMsg] = useState('');

  const run = useCallback(async () => {
    setState('loading');
    try {
      const res = await axios.get(`${API}/api/q${q.id}`);
      if (res.data.success) { setData(res.data.data); setState('done'); }
      else { setErrMsg(res.data.error); setState('error'); }
    } catch (e) { setErrMsg(e.response?.data?.error || e.message); setState('error'); }
  }, [q.id]);

  const cols = data && data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="query-card fade-in">
      <div className="query-card-header">
        <div className="query-num">Q{q.id}</div>
        <div className="query-card-info">
          <div className="query-card-title">{q.title}</div>
          <div className="query-card-desc">{q.desc}</div>
        </div>
        <span className={`query-card-badge ${q.badgeClass}`}>{q.badge}</span>
      </div>
      <div className="query-card-body">
        <div className="query-actions">
          <button className="btn-run" onClick={run} disabled={state === 'loading'}>
            {state === 'loading' ? <span className="spinner" /> : '▶'}
            {state === 'loading' ? 'Running…' : 'Run Query'}
          </button>
          {state === 'done' && <span className="result-count">{data.length} row{data.length !== 1 ? 's' : ''}</span>}
          {state === 'done' && <span className="result-status ok">✓ Success</span>}
          {state === 'error' && <span className="result-status err">✗ Error</span>}
        </div>
        {state === 'error' && <div className="error-state">{errMsg}</div>}
        {state === 'done' && cols.length > 0 && (
          <div className="result-table-wrap">
            <div style={{ overflowX: 'auto', maxHeight: 220, overflowY: 'auto' }}>
              <table className="result-table">
                <thead><tr>{cols.map(c => <th key={c}>{c}</th>)}</tr></thead>
                <tbody>{data.map((row, i) => <tr key={i}>{cols.map(c => <td key={c}>{fmtValue(c, row[c])}</td>)}</tr>)}</tbody>
              </table>
            </div>
          </div>
        )}
        {state === 'done' && data.length === 0 && <div className="empty-state">No rows returned.</div>}
      </div>
    </div>
  );
}

// ─── SQL Explorer (inline, no import loop) ────────────────────────────────────
function SqlExplorer({ onBack }) {
  const [part, setPart] = useState('A');
  return (
    <div style={{ display: 'flex', minHeight: '100%' }}>
      <aside style={{ width: 210, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', padding: '12px 0', overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '8px 16px 6px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Categories</div>
        {PARTS.map(p => (
          <div key={p.id} onClick={() => setPart(p.id)} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 500,
            color: part === p.id ? 'var(--accent-bright)' : 'var(--text-secondary)',
            background: part === p.id ? 'rgba(59,130,246,0.08)' : 'transparent',
            borderLeft: `2px solid ${part === p.id ? 'var(--accent)' : 'transparent'}`
          }}>
            <span>{p.icon}</span><span>Part {p.id}</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 10, background: 'rgba(59,130,246,0.15)', color: 'var(--accent-bright)' }}>{p.badge}</span>
          </div>
        ))}
        <div style={{ padding: '12px 10px 0', marginTop: 8, borderTop: '1px solid var(--border)' }}>
          <button onClick={onBack} style={{ width: '100%', padding: '7px 0', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.3)', color: 'var(--accent-bright)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>← Back to App</button>
        </div>
      </aside>
      <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
          {PARTS.find(p => p.id === part)?.icon} {PART_TITLES[part]}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Click ▶ Run Query to execute live against MySQL</div>
        <div className="queries-grid">
          {QUERIES.filter(q => q.part === part).map(q => <QueryCard key={q.id} q={q} />)}
        </div>
      </div>
    </div>
  );
}

// ─── Top Navigation ───────────────────────────────────────────────────────────
function Navbar({ user, page, setPage, onLogout }) {
  const navItems = [
    { id: 'home', label: '🔍 Search', roles: ['passenger', 'admin'] },
    { id: 'bookings', label: '🎫 My Bookings', roles: ['passenger', 'admin'] },
    { id: 'admin', label: '🔧 Admin', roles: ['admin'] },
    { id: 'sql', label: '📋 SQL Explorer', roles: ['passenger', 'admin'] },
  ].filter(n => n.roles.includes(user.role));

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(6,13,31,0.92)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', padding: '0 24px', height: 56
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 32 }}>
        <span style={{ fontSize: 20 }}>🚂</span>
        <span style={{ fontSize: 15, fontWeight: 800, background: 'linear-gradient(135deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Railway DBMS
        </span>
      </div>

      <div style={{ display: 'flex', gap: 4, flex: 1 }}>
        {navItems.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)} style={{
            padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
            background: page === n.id ? 'rgba(59,130,246,0.15)' : 'transparent',
            color: page === n.id ? 'var(--accent-bright)' : 'var(--text-secondary)'
          }}>{n.label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
            <div style={{ fontSize: 10, color: user.role === 'admin' ? '#fbbf24' : 'var(--success)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{user.role}</div>
            {user.age_category && (
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: 4 }}>
                {user.age_category}
              </div>
            )}
          </div>
        </div>
        <button onClick={onLogout} style={{ padding: '6px 14px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          Logout
        </button>
      </div>
    </nav>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const stored = (() => { try { return JSON.parse(localStorage.getItem('rr_user')); } catch { return null; } })();
  const [user, setUser] = useState(stored);
  const [page, setPage] = useState('home');
  const [bookingTrain, setBookingTrain] = useState(null);

  const handleLogin = (u) => { setUser(u); setPage('home'); };
  const handleLogout = () => { localStorage.removeItem('rr_user'); setUser(null); };

  const handleBook = (train) => { setBookingTrain(train); setPage('booking'); };
  const handleBookSuccess = () => { setBookingTrain(null); setPage('bookings'); };
  const handleBookBack = () => { setBookingTrain(null); setPage('home'); };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar user={user} page={page} setPage={p => { setPage(p); if (p !== 'booking') setBookingTrain(null); }} onLogout={handleLogout} />
      <main style={{ minHeight: 'calc(100vh - 56px)' }}>
        {page === 'home' && <HomePage user={user} onBook={handleBook} />}
        {page === 'booking' && bookingTrain && <BookingPage user={user} train={bookingTrain} onSuccess={handleBookSuccess} onBack={handleBookBack} />}
        {page === 'bookings' && <MyBookingsPage user={user} />}
        {page === 'admin' && user.role === 'admin' && <AdminPage />}
        {page === 'sql' && <SqlExplorer onBack={() => setPage('home')} />}
      </main>
    </div>
  );
}
