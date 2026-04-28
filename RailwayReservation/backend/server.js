const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'vit@123$',
    database: 'railway_reservation',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
});

// Helper to execute queries safely
async function runQuery(res, sql, params = []) {
    try {
        const [rows] = await pool.query(sql, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('[DB ERROR]', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
}

// ── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/api/ping', (req, res) => {
    res.json({ message: 'Railway Reservation API is running!' });
});

// ── PART A: COMPLEX JOINS ────────────────────────────────────────────────────

// Q1. Confirmed tickets with passenger, train, source-destination
app.get('/api/q1', (req, res) => runQuery(res, `
    SELECT t.passenger_name, tr.train_name, tr.source, tr.destination
    FROM ticket t
    JOIN confirm c ON t.ticket_id = c.ticket_id
    JOIN booking b ON t.booking_id = b.booking_id
    JOIN train tr ON b.train_id = tr.train_id
`));

// Q2. All users and their total bookings (incl. 0 bookings)
app.get('/api/q2', (req, res) => runQuery(res, `
    SELECT u.name, COUNT(b.booking_id) AS total_bookings
    FROM user u
    LEFT JOIN booking b ON u.user_id = b.user_id
    GROUP BY u.user_id, u.name
`));

// Q3. Refunded payments with refund percentage
app.get('/api/q3', (req, res) => runQuery(res, `
    SELECT p.payment_id, u.name, p.amount, r.refund_percentage
    FROM payment p
    JOIN refund r ON p.payment_id = r.payment_id
    JOIN booking b ON p.booking_id = b.booking_id
    JOIN user u ON b.user_id = u.user_id
`));

// Q4. Seat type (UP/MB/LB) for each ticket
app.get('/api/q4', (req, res) => runQuery(res, `
    SELECT t.ticket_id, t.passenger_name, c.coach_type,
           CASE 
               WHEN up.seat_id IS NOT NULL THEN 'Upper Berth'
               WHEN mb.seat_id IS NOT NULL THEN 'Middle Berth'
               WHEN lb.seat_id IS NOT NULL THEN 'Lower Berth'
               ELSE 'Unassigned'
           END AS specific_berth
    FROM ticket t
    JOIN seat s ON t.seat_id = s.seat_id
    JOIN coach c ON s.coach_id = c.coach_id
    LEFT JOIN up ON s.seat_id = up.seat_id
    LEFT JOIN mb ON s.seat_id = mb.seat_id
    LEFT JOIN lb ON s.seat_id = lb.seat_id
`));

// Q5. Admins with their departments
app.get('/api/q5', (req, res) => runQuery(res, `
    SELECT a.department, a.access_level, u.name
    FROM admin a
    JOIN user u ON a.user_id = u.user_id
`));

// ── PART B: SUBQUERIES ───────────────────────────────────────────────────────

// Q6. Users who booked from 'New York' (IN)
app.get('/api/q6', (req, res) => runQuery(res, `
    SELECT name FROM user 
    WHERE user_id IN (
        SELECT b.user_id FROM booking b 
        JOIN train tr ON b.train_id = tr.train_id 
        WHERE tr.source = 'New York'
    )
`));

// Q7. Trains with no scheduled trips (NOT EXISTS)
app.get('/api/q7', (req, res) => runQuery(res, `
    SELECT tr.train_name FROM train tr
    WHERE NOT EXISTS (
        SELECT 1 FROM schedule s WHERE s.train_id = tr.train_id
    )
`));

// Q8. Payment with maximum amount (ALL)
app.get('/api/q8', (req, res) => runQuery(res, `
    SELECT payment_id, amount FROM payment 
    WHERE amount >= ALL(SELECT amount FROM payment)
`));

// Q9. Tickets booked via Stripe gateway
app.get('/api/q9', (req, res) => runQuery(res, `
    SELECT t.ticket_id, t.passenger_name FROM ticket t
    WHERE t.booking_id IN (
        SELECT p.booking_id FROM payment p 
        JOIN online o ON p.payment_id = o.payment_id 
        WHERE o.gateway_name = 'Stripe'
    )
`));

// Q10. Passengers older than average age
app.get('/api/q10', (req, res) => runQuery(res, `
    SELECT u.name, p.age FROM passenger p
    JOIN user u ON p.user_id = u.user_id
    WHERE p.age > (SELECT AVG(age) FROM passenger)
`));

// ── PART C: CORRELATED SUBQUERIES ───────────────────────────────────────────

// Q11. Latest booking per user
app.get('/api/q11', (req, res) => runQuery(res, `
    SELECT b1.user_id, b1.booking_id, b1.booking_date 
    FROM booking b1
    WHERE b1.booking_date = (
        SELECT MAX(b2.booking_date) 
        FROM booking b2 
        WHERE b1.user_id = b2.user_id
    )
`));

// Q12. Coaches with more than 2 seats
app.get('/api/q12', (req, res) => runQuery(res, `
    SELECT c.coach_id, c.coach_type FROM coach c
    WHERE 2 < (
        SELECT COUNT(*) FROM seat s WHERE s.coach_id = c.coach_id
    )
`));

// Q13. Trains whose total payment exceeds 100
app.get('/api/q13', (req, res) => runQuery(res, `
    SELECT tr.train_name FROM train tr
    WHERE 100 < (
        SELECT SUM(p.amount) 
        FROM payment p 
        JOIN booking b ON p.booking_id = b.booking_id 
        WHERE b.train_id = tr.train_id
    )
`));

// Q14. Users with at least one cancelled ticket
app.get('/api/q14', (req, res) => runQuery(res, `
    SELECT u.name FROM user u
    WHERE EXISTS (
        SELECT 1 FROM booking b
        JOIN ticket t ON b.booking_id = t.booking_id
        JOIN cancelled c ON t.ticket_id = c.ticket_id
        WHERE b.user_id = u.user_id
    )
`));

// Q15. Tickets on the earliest scheduled departure
app.get('/api/q15', (req, res) => runQuery(res, `
    SELECT t.ticket_id, t.passenger_name FROM ticket t
    JOIN booking b ON t.booking_id = b.booking_id
    WHERE b.schedule_id = (
        SELECT schedule_id FROM schedule ORDER BY dep_time ASC LIMIT 1
    )
`));

// ── PART D: AGGREGATION & GROUPING ──────────────────────────────────────────

// Q16. Revenue per payment method
app.get('/api/q16', (req, res) => runQuery(res, `
    SELECT payment_method, SUM(amount) AS total_revenue
    FROM payment
    GROUP BY payment_method
`));

// Q17. Confirmed vs waitlisted tickets per train
app.get('/api/q17', (req, res) => runQuery(res, `
    SELECT tr.train_name, 
           SUM(CASE WHEN c.ticket_id IS NOT NULL THEN 1 ELSE 0 END) AS confirmed,
           SUM(CASE WHEN w.ticket_id IS NOT NULL THEN 1 ELSE 0 END) AS waitlisted
    FROM train tr
    JOIN booking b ON tr.train_id = b.train_id
    JOIN ticket t ON b.booking_id = t.booking_id
    LEFT JOIN confirm c ON t.ticket_id = c.ticket_id
    LEFT JOIN waiting w ON t.ticket_id = w.ticket_id
    GROUP BY tr.train_id, tr.train_name
`));

// Q18. Users who spent more than $200
app.get('/api/q18', (req, res) => runQuery(res, `
    SELECT u.name, SUM(p.amount) AS total_spent
    FROM user u
    JOIN booking b ON u.user_id = b.user_id
    JOIN payment p ON b.booking_id = p.booking_id
    GROUP BY u.user_id, u.name
    HAVING SUM(p.amount) > 200
`));

// Q19. Average ticket cost per train
app.get('/api/q19', (req, res) => runQuery(res, `
    SELECT tr.train_name, AVG(p.amount) AS avg_cost
    FROM train tr
    JOIN booking b ON tr.train_id = b.train_id
    JOIN payment p ON b.booking_id = p.booking_id
    GROUP BY tr.train_id, tr.train_name
`));

// Q20. Coach type with most passengers
app.get('/api/q20', (req, res) => runQuery(res, `
    SELECT c.coach_type, COUNT(t.ticket_id) AS passenger_count
    FROM coach c
    JOIN seat s ON c.coach_id = s.coach_id
    JOIN ticket t ON s.seat_id = t.seat_id
    GROUP BY c.coach_type
    ORDER BY passenger_count DESC
    LIMIT 1
`));

// ── PART E: WINDOW FUNCTIONS ─────────────────────────────────────────────────
// Note: using user-variable emulation for MySQL 5.7 compatibility
// (MySQL 8+ would use RANK() OVER / ROW_NUMBER() OVER natively)

// Q21. Rank trains by total bookings (variable-based RANK emulation)
app.get('/api/q21', async (req, res) => {
    try {
        await pool.query('SET @rnk := 0');
        const [rows] = await pool.query(`
            SELECT train_name, booking_cnt, @rnk := @rnk + 1 AS rnk
            FROM (
                SELECT tr.train_name, COUNT(b.booking_id) AS booking_cnt
                FROM train tr
                LEFT JOIN booking b ON tr.train_id = b.train_id
                GROUP BY tr.train_id, tr.train_name
                ORDER BY booking_cnt DESC
            ) ranked_trains
        `);
        res.json({ success: true, data: rows });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Q22. Running total of revenue (variable-based SUM OVER emulation)
app.get('/api/q22', async (req, res) => {
    try {
        await pool.query('SET @running := 0');
        const [rows] = await pool.query(`
            SELECT payment_id, amount,
                   @running := @running + amount AS running_total
            FROM payment
            ORDER BY payment_id
        `);
        res.json({ success: true, data: rows });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Q23. Row number of tickets by passenger name (variable-based ROW_NUMBER emulation)
app.get('/api/q23', async (req, res) => {
    try {
        await pool.query('SET @rn := 0');
        const [rows] = await pool.query(`
            SELECT ticket_id, passenger_name,
                   @rn := @rn + 1 AS row_num
            FROM ticket
            ORDER BY passenger_name
        `);
        res.json({ success: true, data: rows });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// PLACEHOLDER — see below for original pattern start
const _q23placeholder = `
    SELECT ticket_id, passenger_name, 
           ROW_NUMBER() OVER(ORDER BY passenger_name) AS row_num
    FROM ticket`;

// Q24. Max payment per user (GROUP-based MAX emulation of PARTITION BY)
app.get('/api/q24', (req, res) => runQuery(res, `
    SELECT u.name, p.amount,
           (SELECT MAX(p2.amount)
            FROM payment p2
            JOIN booking b2 ON p2.booking_id = b2.booking_id
            WHERE b2.user_id = u.user_id) AS max_spent_by_user
    FROM user u
    JOIN booking b ON u.user_id = b.user_id
    JOIN payment p ON b.booking_id = p.booking_id
`));

// Q25. Next departure time per train (self-JOIN emulation of LEAD OVER)
app.get('/api/q25', (req, res) => runQuery(res, `
    SELECT s1.train_id, s1.dep_time,
           MIN(s2.dep_time) AS next_dep_time
    FROM schedule s1
    LEFT JOIN schedule s2
        ON s1.train_id = s2.train_id AND s2.dep_time > s1.dep_time
    GROUP BY s1.schedule_id, s1.train_id, s1.dep_time
    ORDER BY s1.train_id, s1.dep_time
`));

// ── PART F: CTEs (MySQL 5.7 compatible — uses derived tables as CTE equivalent) ────

// Q26. Cancellation rate (CTE emulated as scalar subqueries)
app.get('/api/q26', (req, res) => runQuery(res, `
    SELECT
        (SELECT COUNT(*) FROM cancelled) AS cancelled_cnt,
        (SELECT COUNT(*) FROM ticket) AS total_cnt,
        ROUND(
            (SELECT COUNT(*) FROM cancelled) /
            (SELECT COUNT(*) FROM ticket) * 100, 2
        ) AS cancellation_rate
`));

// Q27. AC coaches with seat counts (CTE emulated as derived table)
app.get('/api/q27', (req, res) => runQuery(res, `
    SELECT a.coach_id, COUNT(s.seat_id) AS total_seats
    FROM (SELECT * FROM coach WHERE coach_type = 'AC') AS a
    LEFT JOIN seat s ON a.coach_id = s.coach_id
    GROUP BY a.coach_id
`));

// Q28. Net profit report (multi-CTE emulated as subqueries)
app.get('/api/q28', (req, res) => runQuery(res, `
    SELECT
        (SELECT SUM(amount) FROM payment WHERE payment_status = 'COMPLETED') AS incoming,
        (SELECT SUM(amount) FROM payment WHERE payment_status = 'REFUNDED')  AS outgoing,
        (SELECT SUM(amount) FROM payment WHERE payment_status = 'COMPLETED')
        - (SELECT SUM(amount) FROM payment WHERE payment_status = 'REFUNDED') AS net_profit
`));

// Q29. Sequential number generation (emulated via integers trick)
app.get('/api/q29', async (req, res) => {
    try {
        const [[{ cnt }]] = await pool.query('SELECT COUNT(*) AS cnt FROM ticket');
        const rows = Array.from({ length: cnt }, (_, i) => ({ value: i + 1 }));
        res.json({ success: true, data: rows });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Q30. Frequent travelers (CTE emulated as derived table)
app.get('/api/q30', (req, res) => runQuery(res, `
    SELECT u.name, ft.b_cnt
    FROM (
        SELECT user_id, COUNT(booking_id) AS b_cnt
        FROM booking
        GROUP BY user_id
        HAVING COUNT(booking_id) > 1
    ) AS ft
    JOIN user u ON ft.user_id = u.user_id
`));

// ── PART G: VIEWS ─────────────────────────────────────────────────────────────

// Q31. Create + query PassengerManifest view
app.get('/api/q31', async (req, res) => {
    try {
        await pool.query(`
            CREATE OR REPLACE VIEW PassengerManifest AS
            SELECT t.ticket_id, t.passenger_name, tr.train_name, s.dep_time, c.coach_type
            FROM ticket t
            JOIN booking b ON t.booking_id = b.booking_id
            JOIN train tr ON b.train_id = tr.train_id
            JOIN schedule s ON b.schedule_id = s.schedule_id
            JOIN seat st ON t.seat_id = st.seat_id
            JOIN coach c ON st.coach_id = c.coach_id
        `);
        const [rows] = await pool.query(`SELECT * FROM PassengerManifest`);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('[DB ERROR]', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Q32. Query PassengerManifest for Express 101
app.get('/api/q32', (req, res) => runQuery(res, `SELECT * FROM PassengerManifest WHERE train_name = 'Express 101'`));

// Q33. Create + query RevenueDashboard view
app.get('/api/q33', async (req, res) => {
    try {
        await pool.query(`
            CREATE OR REPLACE VIEW RevenueDashboard AS
            SELECT tr.train_name, SUM(p.amount) AS total_revenue, COUNT(p.payment_id) AS total_txns
            FROM payment p
            JOIN booking b ON p.booking_id = b.booking_id
            JOIN train tr ON b.train_id = tr.train_id
            WHERE p.payment_status = 'COMPLETED'
            GROUP BY tr.train_id, tr.train_name
        `);
        const [rows] = await pool.query(`SELECT * FROM RevenueDashboard ORDER BY total_revenue DESC`);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('[DB ERROR]', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Q34. Query RevenueDashboard (already created)
app.get('/api/q34', (req, res) => runQuery(res, `SELECT * FROM RevenueDashboard ORDER BY total_revenue DESC`));

// Q35. Create + query UpcomingTrains view
app.get('/api/q35', async (req, res) => {
    try {
        await pool.query(`
            CREATE OR REPLACE VIEW UpcomingTrains AS
            SELECT tr.train_name, s.dep_time 
            FROM train tr
            JOIN schedule s ON tr.train_id = s.train_id
            WHERE s.dep_time > NOW()
        `);
        const [rows] = await pool.query(`SELECT * FROM UpcomingTrains`);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('[DB ERROR]', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── PART H: STORED PROCEDURES & FUNCTIONS ───────────────────────────────────

// Q36. Create GetAgeCategory function + call it
app.get('/api/q36', async (req, res) => {
    try {
        await pool.query(`DROP FUNCTION IF EXISTS GetAgeCategory`);
        await pool.query(`
            CREATE FUNCTION GetAgeCategory(p_age INT) RETURNS VARCHAR(20)
            READS SQL DATA DETERMINISTIC
            BEGIN
                DECLARE cat VARCHAR(20);
                IF p_age < 18 THEN SET cat = 'Minor';
                ELSEIF p_age >= 60 THEN SET cat = 'Senior';
                ELSE SET cat = 'Adult';
                END IF;
                RETURN cat;
            END
        `);
        const [rows] = await pool.query(`
            SELECT p.passenger_id, u.name, p.age, GetAgeCategory(p.age) AS category
            FROM passenger p JOIN user u ON p.user_id = u.user_id
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('[DB ERROR]', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Q37. Stored procedure: ProcessRefund
app.get('/api/q37', async (req, res) => {
    try {
        await pool.query(`DROP PROCEDURE IF EXISTS ProcessRefund`);
        await pool.query(`
            CREATE PROCEDURE ProcessRefund(IN p_payment_id INT, IN p_reason VARCHAR(255))
            BEGIN
                DECLARE exit handler for sqlexception BEGIN ROLLBACK; END;
                START TRANSACTION;
                UPDATE payment SET payment_status = 'REFUNDED' WHERE payment_id = p_payment_id;
                INSERT IGNORE INTO refund (payment_id, refund_percentage, processed_date) VALUES (p_payment_id, 100, NOW());
                INSERT IGNORE INTO cancellation (payment_id, reason) VALUES (p_payment_id, p_reason);
                COMMIT;
            END
        `);
        res.json({
            success: true,
            data: [{ procedure_name: 'ProcessRefund', status: 'Created Successfully', description: 'Processes a full refund for a payment, updating status and logging cancellation in a transaction.' }]
        });
    } catch (error) {
        console.error('[DB ERROR]', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Q38. Stored procedure: GetBookedSeats
app.get('/api/q38', async (req, res) => {
    try {
        await pool.query(`DROP PROCEDURE IF EXISTS GetBookedSeats`);
        await pool.query(`
            CREATE PROCEDURE GetBookedSeats(IN p_train_id INT)
            BEGIN
                SELECT s.seat_id, c.coach_type 
                FROM seat s 
                JOIN coach c ON s.coach_id = c.coach_id
                WHERE c.train_id = p_train_id AND s.seat_id IN (SELECT seat_id FROM ticket);
            END
        `);
        // Call the procedure with train_id = 1 as a demo
        const [rows] = await pool.query(`CALL GetBookedSeats(1)`);
        res.json({ success: true, data: rows[0] || [] });
    } catch (error) {
        console.error('[DB ERROR]', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Q39. Call GetAgeCategory function
app.get('/api/q39', (req, res) => runQuery(res, `
    SELECT p.passenger_id, u.name, p.age, GetAgeCategory(p.age) AS category
    FROM passenger p JOIN user u ON p.user_id = u.user_id
`));

// ── PART I: TRIGGERS ─────────────────────────────────────────────────────────

// Q40. Create trigger: trg_check_payment_amount
app.get('/api/q40', async (req, res) => {
    try {
        await pool.query(`DROP TRIGGER IF EXISTS trg_check_payment_amount`);
        await pool.query(`
            CREATE TRIGGER trg_check_payment_amount BEFORE INSERT ON payment
            FOR EACH ROW
            BEGIN
                IF NEW.amount < 0 THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment amount cannot be negative';
                END IF;
            END
        `);
        res.json({
            success: true,
            data: [{ trigger_name: 'trg_check_payment_amount', event: 'BEFORE INSERT ON payment', status: 'Created Successfully', description: 'Prevents negative payment amounts from being inserted into the payment table.' }]
        });
    } catch (error) {
        console.error('[DB ERROR]', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Q41. Create trigger: trg_log_cancellations + show audit log
app.get('/api/q41', async (req, res) => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cancellation_log (
                log_id INT AUTO_INCREMENT PRIMARY KEY,
                payment_id INT,
                cancel_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await pool.query(`DROP TRIGGER IF EXISTS trg_log_cancellations`);
        await pool.query(`
            CREATE TRIGGER trg_log_cancellations AFTER INSERT ON cancellation
            FOR EACH ROW
            BEGIN
                INSERT INTO cancellation_log (payment_id) VALUES (NEW.payment_id);
            END
        `);
        const [rows] = await pool.query(`SELECT * FROM cancellation_log`);
        res.json({ success: true, data: rows.length > 0 ? rows : [{ info: 'trg_log_cancellations created. Log is currently empty — insert a cancellation to see it populate.' }] });
    } catch (error) {
        console.error('[DB ERROR]', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Q42. List all triggers in the database
app.get('/api/q42', (req, res) => runQuery(res, `
    SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE, ACTION_TIMING, CREATED
    FROM information_schema.TRIGGERS 
    WHERE TRIGGER_SCHEMA = 'railway_reservation'
`));

// ── PART J: COMPLEX COMBINATIONS (MySQL 5.7 — derived tables + variable ranking) ───

// Q43. Travel diversity ranking (derived table + variable DENSE_RANK emulation)
app.get('/api/q43', async (req, res) => {
    try {
        await pool.query('SET @prev_trains := -1, @dense_rnk := 0');
        const [rows] = await pool.query(`
            SELECT name, unique_trains,
                   @dense_rnk := IF(@prev_trains = unique_trains, @dense_rnk, @dense_rnk + 1) AS diversity_rank,
                   @prev_trains := unique_trains
            FROM (
                SELECT u.name, COUNT(DISTINCT b.train_id) AS unique_trains
                FROM user u
                JOIN booking b ON u.user_id = b.user_id
                GROUP BY u.user_id, u.name
                ORDER BY unique_trains DESC
            ) ranked
        `);
        res.json({ success: true, data: rows.map(r => ({ name: r.name, unique_trains: r.unique_trains, diversity_rank: r.diversity_rank })) });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Q44. Top payment method excl. refunds (derived table + variable RANK emulation)
app.get('/api/q44', async (req, res) => {
    try {
        await pool.query('SET @prev_cnt := -1, @pop_rnk := 0');
        const [rows] = await pool.query(`
            SELECT payment_method, usage_count,
                   @pop_rnk := IF(@prev_cnt = usage_count, @pop_rnk, @pop_rnk + 1) AS popularity_rank,
                   @prev_cnt := usage_count
            FROM (
                SELECT payment_method, COUNT(*) AS usage_count
                FROM payment
                WHERE payment_status != 'REFUNDED'
                GROUP BY payment_method
                ORDER BY usage_count DESC
            ) vp
        `);
        res.json({ success: true, data: rows.map(r => ({ payment_method: r.payment_method, usage_count: r.usage_count, popularity_rank: r.popularity_rank })) });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Q45. Avg passenger age per admin department (Multi-level JOIN)
app.get('/api/q45', (req, res) => runQuery(res, `
    SELECT a.admin_id, a.department, AVG(psg.age) AS avg_passenger_age
    FROM admin a
    JOIN user admin_u ON a.user_id = admin_u.user_id
    CROSS JOIN booking b
    JOIN user psg_u ON b.user_id = psg_u.user_id
    JOIN passenger psg ON psg_u.user_id = psg.user_id
    GROUP BY a.admin_id, a.department
`));

// ── EXTENDED QUERIES (Q46 - Q85) ───────────────────────────────────────────

app.get('/api/q46', (req, res) => runQuery(res, "SELECT MONTH(booking_date) as month, SUM(p.amount) as revenue FROM booking b JOIN payment p ON b.booking_id = p.booking_id GROUP BY month ORDER BY month"));
app.get('/api/q47', (req, res) => runQuery(res, "SELECT destination, COUNT(*) as arrivals FROM train GROUP BY destination ORDER BY arrivals DESC"));
app.get('/api/q48', (req, res) => runQuery(res, "SELECT u.name FROM user u WHERE NOT EXISTS (SELECT DISTINCT coach_type FROM coach WHERE coach_type NOT IN (SELECT c.coach_type FROM booking b JOIN ticket t ON b.booking_id = t.ticket_id JOIN seat s ON t.seat_id = s.seat_id JOIN coach c ON s.coach_id = c.coach_id WHERE b.user_id = u.user_id))"));
app.get('/api/q49', (req, res) => runQuery(res, "SELECT train_name FROM train WHERE train_id IN (SELECT train_id FROM booking GROUP BY train_id HAVING COUNT(*) > (SELECT COUNT(*) / COUNT(DISTINCT train_id) FROM booking))"));
app.get('/api/q50', (req, res) => runQuery(res, "SELECT tr.train_name, AVG(TIMESTAMPDIFF(MINUTE, s.dep_time, s.arr_time)) as avg_duration FROM train tr JOIN schedule s ON tr.train_id = s.train_id GROUP BY tr.train_id"));
app.get('/api/q51', (req, res) => runQuery(res, "SELECT GetAgeCategory(p.age) as age_group, SUM(pay.amount) as revenue FROM passenger p JOIN booking b ON p.user_id = b.user_id JOIN payment pay ON b.booking_id = pay.booking_id GROUP BY age_group"));
app.get('/api/q52', (req, res) => runQuery(res, "SELECT u.name, COUNT(b.booking_id) as cnt FROM user u JOIN booking b ON u.user_id = b.user_id GROUP BY u.user_id ORDER BY cnt DESC LIMIT 5"));
app.get('/api/q53', (req, res) => runQuery(res, "SELECT tr.train_name, (COUNT(r.payment_id) / COUNT(p.payment_id)) * 100 as refund_rate FROM train tr JOIN booking b ON tr.train_id = b.train_id JOIN payment p ON b.booking_id = p.booking_id LEFT JOIN refund r ON p.payment_id = r.payment_id GROUP BY tr.train_id ORDER BY refund_rate DESC"));
app.get('/api/q54', (req, res) => runQuery(res, "SELECT c.coach_id, c.coach_type, (SELECT COUNT(*) FROM seat s WHERE s.coach_id = c.coach_id) as total_seats, (SELECT COUNT(*) FROM ticket t JOIN seat s ON t.seat_id = s.seat_id WHERE s.coach_id = c.coach_id) as booked_seats FROM coach c"));
app.get('/api/q55', (req, res) => runQuery(res, "SELECT name FROM user WHERE user_id NOT IN (SELECT b.user_id FROM booking b JOIN ticket t ON b.booking_id = t.ticket_id JOIN cancelled c ON t.ticket_id = c.ticket_id)"));
app.get('/api/q56', (req, res) => runQuery(res, "SELECT a.department, SUM(p.amount) as revenue FROM admin a JOIN user u ON a.user_id = u.user_id JOIN booking b ON 1=1 JOIN payment p ON b.booking_id = p.booking_id GROUP BY a.department"));
app.get('/api/q57', (req, res) => runQuery(res, "SELECT passenger_name, COUNT(*) as freq FROM ticket GROUP BY passenger_name ORDER BY freq DESC"));
app.get('/api/q58', (req, res) => runQuery(res, "SELECT c.coach_type, AVG(p.amount) as avg_price FROM coach c JOIN seat s ON c.coach_id = s.coach_id JOIN ticket t ON s.seat_id = t.seat_id JOIN payment p ON t.booking_id = p.booking_id GROUP BY c.coach_type"));
app.get('/api/q59', (req, res) => runQuery(res, "SELECT s1.train_id, s1.schedule_id, s2.schedule_id FROM schedule s1 JOIN schedule s2 ON s1.train_id = s2.train_id WHERE s1.schedule_id < s2.schedule_id AND s1.arr_time > s2.dep_time"));
app.get('/api/q60', (req, res) => runQuery(res, "SELECT u.name as user_name, t.passenger_name FROM user u JOIN booking b ON u.user_id = b.user_id JOIN ticket t ON b.booking_id = t.booking_id WHERE u.name != t.passenger_name"));
app.get('/api/q61', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT coach_id, SUM(amount) as rev FROM seat s JOIN ticket t ON s.seat_id = t.seat_id JOIN payment p ON t.booking_id = p.booking_id GROUP BY coach_id ORDER BY rev DESC");
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.get('/api/q62', (req, res) => runQuery(res, "SELECT * FROM payment ORDER BY amount DESC LIMIT 1"));
app.get('/api/q63', (req, res) => runQuery(res, "SELECT coach_type, (COUNT(*) / (SELECT COUNT(*) FROM ticket)) * 100 as pct FROM coach c JOIN seat s ON c.coach_id = s.coach_id JOIN ticket t ON s.seat_id = t.seat_id GROUP BY coach_type"));
app.get('/api/q64', (req, res) => runQuery(res, "SELECT train_name FROM train tr WHERE NOT EXISTS (SELECT seat_id FROM seat s JOIN coach c ON s.coach_id = c.coach_id WHERE c.train_id = tr.train_id AND seat_id NOT IN (SELECT seat_id FROM ticket))"));
app.get('/api/q65', (req, res) => runQuery(res, "SELECT user_id, COUNT(DISTINCT payment_method) as methods FROM booking b JOIN payment p ON b.booking_id = p.booking_id GROUP BY user_id HAVING methods > 1"));
app.get('/api/q66', (req, res) => runQuery(res, "SELECT AVG(TIMESTAMPDIFF(HOUR, booking_date, dep_time)) as lead_time FROM booking b JOIN schedule s ON b.schedule_id = s.schedule_id"));
app.get('/api/q67', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT m1.month, m1.revenue, m1.revenue - m2.revenue as growth
            FROM (SELECT MONTH(booking_date) as month, SUM(p.amount) as revenue FROM booking b JOIN payment p ON b.booking_id = p.booking_id GROUP BY month) as m1
            LEFT JOIN (SELECT MONTH(booking_date) as month, SUM(p.amount) as revenue FROM booking b JOIN payment p ON b.booking_id = p.booking_id GROUP BY month) as m2 ON m1.month = m2.month + 1
        `);
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.get('/api/q68', (req, res) => runQuery(res, "SELECT HOUR(booking_date) as hr, COUNT(*) as cnt FROM booking GROUP BY hr ORDER BY cnt DESC"));
app.get('/api/q69', (req, res) => runQuery(res, "SELECT train_name FROM train GROUP BY train_name HAVING COUNT(DISTINCT source) > 2"));
app.get('/api/q70', (req, res) => runQuery(res, "SELECT DISTINCT u.name FROM user u JOIN passenger psg ON u.user_id = psg.user_id WHERE u.user_id NOT IN (SELECT b.user_id FROM booking b JOIN ticket t ON b.booking_id = t.ticket_id JOIN seat s ON t.seat_id = s.seat_id JOIN coach c ON s.coach_id = c.coach_id WHERE c.coach_type = 'AC')"));
app.get('/api/q71', (req, res) => runQuery(res, "SELECT train_name FROM train WHERE train_id NOT IN (SELECT train_id FROM booking)"));
app.get('/api/q72', (req, res) => runQuery(res, "SELECT tr.train_name, AVG(p.age) as avg_age FROM train tr JOIN booking b ON tr.train_id = b.train_id JOIN passenger p ON b.user_id = p.user_id GROUP BY tr.train_id"));
app.get('/api/q73', (req, res) => runQuery(res, "SELECT s.seat_id, SUM(p.amount) as revenue FROM seat s LEFT JOIN ticket t ON s.seat_id = t.seat_id LEFT JOIN payment p ON t.booking_id = p.booking_id GROUP BY s.seat_id"));
app.get('/api/q74', (req, res) => runQuery(res, "SELECT user_id, train_id, COUNT(*) as cnt FROM booking GROUP BY user_id, train_id HAVING cnt > 1"));
app.get('/api/q75', (req, res) => runQuery(res, "SELECT train_name, TIMESTAMPDIFF(MINUTE, dep_time, arr_time) as duration FROM train tr JOIN schedule s ON tr.train_id = s.train_id ORDER BY duration DESC LIMIT 1"));
app.get('/api/q76', (req, res) => runQuery(res, "SELECT gateway_name, COUNT(*) as high_val_cnt FROM online o JOIN payment p ON o.payment_id = p.payment_id WHERE p.amount > 150 GROUP BY gateway_name"));
app.get('/api/q77', (req, res) => runQuery(res, "SELECT DISTINCT u.name FROM user u JOIN booking b ON u.user_id = b.user_id WHERE b.booking_date > DATE_SUB(NOW(), INTERVAL 7 DAY)"));
app.get('/api/q78', (req, res) => runQuery(res, "SELECT SUM(cancellation_fee) as total_fees FROM cancelled"));
app.get('/api/q79', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT destination, COUNT(*) as bookings FROM train tr JOIN booking b ON tr.train_id = b.train_id GROUP BY destination ORDER BY bookings DESC");
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.get('/api/q80', (req, res) => runQuery(res, "SELECT booking_id, COUNT(*) as tickets FROM ticket GROUP BY booking_id HAVING tickets > 1"));
app.get('/api/q81', (req, res) => runQuery(res, "SELECT gateway_name, AVG(amount) as avg_refund FROM online o JOIN payment p ON o.payment_id = p.payment_id WHERE p.payment_status = 'REFUNDED' GROUP BY gateway_name"));
app.get('/api/q82', (req, res) => runQuery(res, "SELECT u.name FROM user u JOIN admin a ON u.user_id = a.user_id WHERE a.access_level = 'SUPER_ADMIN'"));
app.get('/api/q83', (req, res) => runQuery(res, "SELECT tr.train_name, s.dep_time FROM train tr JOIN schedule s ON tr.train_id = s.train_id WHERE s.dep_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)"));
app.get('/api/q84', (req, res) => runQuery(res, "SELECT gender, COUNT(*) as cnt FROM passenger GROUP BY gender ORDER BY cnt DESC LIMIT 1"));
app.get('/api/q85', (req, res) => runQuery(res, "SELECT DATEDIFF(NOW(), MIN(created_at)) as uptime_days FROM user"));

// ── AUTH ──────────────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const [ex] = await pool.query('SELECT user_id FROM user WHERE email = ?', [email]);
        if (ex.length > 0) return res.status(409).json({ success: false, error: 'Email already registered' });
        const [r] = await pool.query('INSERT INTO user (name, email, password) VALUES (?, ?, ?)', [name, email, password]);
        await pool.query('INSERT INTO passenger (user_id, age, gender) VALUES (?, ?, ?)', [r.insertId, 25, 'PREFER_NOT_TO_SAY']);
        res.json({ success: true, user: { user_id: r.insertId, name, email, role: 'passenger' } });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.query(`
            SELECT u.*, a.admin_id, p.age, GetAgeCategory(p.age) AS age_category
            FROM user u 
            LEFT JOIN admin a ON u.user_id = a.user_id 
            LEFT JOIN passenger p ON u.user_id = p.user_id
            WHERE u.email = ? AND u.password = ?
        `, [email, password]);
        if (rows.length === 0) return res.status(401).json({ success: false, error: 'Invalid email or password' });
        const u = rows[0];
        res.json({ success: true, user: { user_id: u.user_id, name: u.name, email: u.email, role: u.admin_id ? 'admin' : 'passenger', age_category: u.age_category } });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── TRAINS (PUBLIC) ───────────────────────────────────────────────────────────
app.get('/api/trains', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT t.*, COUNT(DISTINCT s.schedule_id) AS schedule_count, COUNT(DISTINCT c.coach_id) AS coach_count
            FROM train t
            LEFT JOIN schedule s ON t.train_id = s.train_id
            LEFT JOIN coach c ON t.train_id = c.train_id
            GROUP BY t.train_id ORDER BY t.train_id
        `);
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/trains/search', async (req, res) => {
    const { source = '', destination = '' } = req.query;
    try {
        const [rows] = await pool.query(`
            SELECT t.train_id, t.train_name, t.source, t.destination, t.status,
                   s.schedule_id, s.dep_time, s.arr_time,
                   COUNT(DISTINCT seat.seat_id) AS total_seats,
                   COUNT(DISTINCT tk.ticket_id) AS booked_seats,
                   COUNT(DISTINCT seat.seat_id) - COUNT(DISTINCT tk.ticket_id) AS available_seats,
                   TIMESTAMPDIFF(MINUTE, s.dep_time, s.arr_time) AS duration_mins
            FROM train t
            JOIN schedule s ON t.train_id = s.train_id
            LEFT JOIN coach c ON t.train_id = c.train_id
            LEFT JOIN seat ON c.coach_id = seat.coach_id
            LEFT JOIN ticket tk ON seat.seat_id = tk.seat_id
                AND tk.booking_id IN (SELECT booking_id FROM booking WHERE schedule_id = s.schedule_id)
            WHERE t.source LIKE ? AND t.destination LIKE ? AND t.status = 'ACTIVE'
            GROUP BY t.train_id, s.schedule_id
            ORDER BY s.dep_time ASC
        `, [`%${source}%`, `%${destination}%`]);
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/trains/:trainId/seats', async (req, res) => {
    const { scheduleId } = req.query;
    try {
        const [rows] = await pool.query(`
            SELECT s.seat_id, c.coach_type, c.coach_id,
                   CASE WHEN up.seat_id IS NOT NULL THEN 'Upper Berth'
                        WHEN mb.seat_id IS NOT NULL THEN 'Middle Berth'
                        WHEN lb.seat_id IS NOT NULL THEN 'Lower Berth'
                        ELSE 'General' END AS berth_type,
                   CASE WHEN tk.seat_id IS NOT NULL THEN 1 ELSE 0 END AS is_booked
            FROM seat s
            JOIN coach c ON s.coach_id = c.coach_id
            LEFT JOIN up ON s.seat_id = up.seat_id
            LEFT JOIN mb ON s.seat_id = mb.seat_id
            LEFT JOIN lb ON s.seat_id = lb.seat_id
            LEFT JOIN ticket tk ON s.seat_id = tk.seat_id
                AND tk.booking_id IN (SELECT booking_id FROM booking WHERE schedule_id = ?)
            WHERE c.train_id = ?
            ORDER BY c.coach_type, s.seat_id
        `, [scheduleId || 0, req.params.trainId]);
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── BOOKINGS ──────────────────────────────────────────────────────────────────
app.post('/api/bookings', async (req, res) => {
    const { user_id, train_id, schedule_id, seat_id, passenger_name, amount, payment_method } = req.body;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [existing] = await conn.query(
            'SELECT t.ticket_id FROM ticket t JOIN booking b ON t.booking_id = b.booking_id WHERE t.seat_id = ? AND b.schedule_id = ?',
            [seat_id, schedule_id]
        );
        if (existing.length > 0) { await conn.rollback(); return res.status(409).json({ success: false, error: 'Seat already booked' }); }

        const [br] = await conn.query('INSERT INTO booking (user_id, train_id, schedule_id) VALUES (?, ?, ?)', [user_id, train_id, schedule_id]);
        const booking_id = br.insertId;
        const [tr2] = await conn.query('INSERT INTO ticket (booking_id, seat_id, passenger_name) VALUES (?, ?, ?)', [booking_id, seat_id, passenger_name]);
        const ticket_id = tr2.insertId;
        await conn.query('INSERT INTO confirm (ticket_id) VALUES (?)', [ticket_id]);

        const pStatus = 'COMPLETED';
        const [pr] = await conn.query('INSERT INTO payment (booking_id, amount, payment_method, payment_status) VALUES (?, ?, ?, ?)', [booking_id, amount, payment_method, pStatus]);
        await conn.query('INSERT INTO online (payment_id, gateway_name, transaction_ref) VALUES (?, ?, ?)',
            [pr.insertId, payment_method === 'CREDIT_CARD' ? 'Stripe' : 'Razorpay', `TXN_${Date.now()}`]);

        await conn.commit();
        res.json({ success: true, data: { booking_id, ticket_id, payment_status: pStatus, amount } });
    } catch (e) { await conn.rollback(); res.status(500).json({ success: false, error: e.message }); }
    finally { conn.release(); }
});

app.get('/api/bookings/user/:userId', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT b.booking_id, b.booking_date,
                   t.ticket_id, t.passenger_name, t.seat_id,
                   tr.train_name, tr.source, tr.destination,
                   s.dep_time, s.arr_time,
                   p.amount, p.payment_method, p.payment_status,
                   c.coach_type,
                   CASE WHEN conf.ticket_id IS NOT NULL THEN 'CONFIRMED'
                        WHEN w.ticket_id IS NOT NULL THEN 'WAITING'
                        WHEN can.ticket_id IS NOT NULL THEN 'CANCELLED'
                        ELSE 'PENDING' END AS ticket_status
            FROM booking b
            JOIN ticket t ON b.booking_id = t.booking_id
            JOIN train tr ON b.train_id = tr.train_id
            JOIN schedule s ON b.schedule_id = s.schedule_id
            LEFT JOIN payment p ON b.booking_id = p.booking_id
            JOIN seat st ON t.seat_id = st.seat_id
            JOIN coach c ON st.coach_id = c.coach_id
            LEFT JOIN confirm conf ON t.ticket_id = conf.ticket_id
            LEFT JOIN waiting w ON t.ticket_id = w.ticket_id
            LEFT JOIN cancelled can ON t.ticket_id = can.ticket_id
            WHERE b.user_id = ? ORDER BY b.booking_date DESC
        `, [req.params.userId]);
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/bookings/:id/cancel', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [tickets] = await conn.query('SELECT ticket_id FROM ticket WHERE booking_id = ?', [req.params.id]);
        if (!tickets.length) { await conn.rollback(); return res.status(404).json({ success: false, error: 'Not found' }); }
        const ticket_id = tickets[0].ticket_id;
        await conn.query('DELETE FROM confirm WHERE ticket_id = ?', [ticket_id]);
        await conn.query('INSERT IGNORE INTO cancelled (ticket_id, cancellation_fee) VALUES (?, ?)', [ticket_id, 10.00]);
        const [pays] = await conn.query('SELECT payment_id FROM payment WHERE booking_id = ?', [req.params.id]);
        if (pays.length) {
            // Using the ProcessRefund stored procedure to handle refund and cancellation entries in transaction
            await conn.query('CALL ProcessRefund(?, ?)', [pays[0].payment_id, 'Cancelled by user']);
        }
        await conn.commit();
        res.json({ success: true, message: 'Cancelled successfully using ProcessRefund Procedure' });
    } catch (e) { await conn.rollback(); res.status(500).json({ success: false, error: e.message }); }
    finally { conn.release(); }
});

// ── ADMIN CRUD ────────────────────────────────────────────────────────────────
app.get('/api/admin/cancellations', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT c.*, p.booking_id, p.amount FROM cancellation_log c JOIN payment p ON c.payment_id = p.payment_id ORDER BY c.cancel_time DESC');
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/admin/trains', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT t.*, COUNT(DISTINCT s.schedule_id) AS schedules, COUNT(DISTINCT c.coach_id) AS coaches
            FROM train t LEFT JOIN schedule s ON t.train_id = s.train_id LEFT JOIN coach c ON t.train_id = c.train_id
            GROUP BY t.train_id ORDER BY t.train_id
        `);
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.post('/api/admin/trains', async (req, res) => {
    const { train_name, source, destination, status = 'ACTIVE' } = req.body;
    try {
        const [r] = await pool.query('INSERT INTO train (train_name, source, destination, status) VALUES (?, ?, ?, ?)', [train_name, source, destination, status]);
        res.json({ success: true, data: { train_id: r.insertId, train_name, source, destination, status } });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.put('/api/admin/trains/:id', async (req, res) => {
    const { train_name, source, destination, status } = req.body;
    try {
        await pool.query('UPDATE train SET train_name=?, source=?, destination=?, status=? WHERE train_id=?', [train_name, source, destination, status, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.delete('/api/admin/trains/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM train WHERE train_id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/admin/schedules', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.*, t.train_name, t.source, t.destination, COUNT(b.booking_id) AS bookings
            FROM schedule s JOIN train t ON s.train_id = t.train_id
            LEFT JOIN booking b ON s.schedule_id = b.schedule_id
            GROUP BY s.schedule_id ORDER BY s.dep_time
        `);
        res.json({ success: true, data: rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.post('/api/admin/schedules', async (req, res) => {
    const { train_id, dep_time, arr_time } = req.body;
    try {
        const [r] = await pool.query('INSERT INTO schedule (train_id, dep_time, arr_time) VALUES (?, ?, ?)', [train_id, dep_time, arr_time]);
        res.json({ success: true, data: { schedule_id: r.insertId } });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.delete('/api/admin/schedules/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM schedule WHERE schedule_id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── ADMIN ANALYTICS ───────────────────────────────────────────────────────────
app.get('/api/admin/analytics', async (req, res) => {
    try {
        const [[rev]] = await pool.query(`
            SELECT SUM(CASE WHEN payment_status='COMPLETED' THEN amount ELSE 0 END) AS total_revenue,
                   SUM(CASE WHEN payment_status='REFUNDED' THEN amount ELSE 0 END) AS total_refunds,
                   COUNT(*) AS total_transactions,
                   COUNT(CASE WHEN payment_status='COMPLETED' THEN 1 END) AS successful_payments
            FROM payment
        `);
        const [trainRank] = await pool.query(`
            SELECT tr.train_name, COUNT(b.booking_id) AS booking_cnt
            FROM train tr LEFT JOIN booking b ON tr.train_id = b.train_id
            GROUP BY tr.train_id ORDER BY booking_cnt DESC
        `);
        const [byMethod] = await pool.query(`SELECT payment_method, SUM(amount) AS total_revenue, COUNT(*) AS cnt FROM payment GROUP BY payment_method`);
        const [[ts]] = await pool.query(`
            SELECT COUNT(CASE WHEN conf.ticket_id IS NOT NULL THEN 1 END) AS confirmed,
                   COUNT(CASE WHEN w.ticket_id IS NOT NULL THEN 1 END) AS waiting,
                   COUNT(CASE WHEN can.ticket_id IS NOT NULL THEN 1 END) AS cancelled
            FROM ticket t
            LEFT JOIN confirm conf ON t.ticket_id = conf.ticket_id
            LEFT JOIN waiting w ON t.ticket_id = w.ticket_id
            LEFT JOIN cancelled can ON t.ticket_id = can.ticket_id
        `);
        const [recent] = await pool.query(`
            SELECT b.booking_id, u.name, tr.train_name, b.booking_date, p.amount, p.payment_status
            FROM booking b
            JOIN user u ON b.user_id = u.user_id
            JOIN train tr ON b.train_id = tr.train_id
            LEFT JOIN payment p ON b.booking_id = p.booking_id
            ORDER BY b.booking_date DESC LIMIT 10
        `);

        // NEW PART K INTEGRATIONS
        // Simulated LAG() using a self-join for compatibility with MySQL 5.7
        const [growth] = await pool.query(`
            SELECT m1.month, m1.revenue, m1.revenue - m2.revenue as growth
            FROM (
                SELECT MONTH(booking_date) as month, SUM(p.amount) as revenue 
                FROM booking b JOIN payment p ON b.booking_id = p.booking_id 
                GROUP BY month
            ) as m1
            LEFT JOIN (
                SELECT MONTH(booking_date) as month, SUM(p.amount) as revenue 
                FROM booking b JOIN payment p ON b.booking_id = p.booking_id 
                GROUP BY month
            ) as m2 ON m1.month = m2.month + 1
        `);
        const [peak] = await pool.query(`SELECT HOUR(booking_date) as hr, COUNT(*) as cnt FROM booking GROUP BY hr ORDER BY hr`);
        const [dist] = await pool.query(`SELECT coach_type, (COUNT(*) / NULLIF((SELECT COUNT(*) FROM ticket), 0)) * 100 as pct FROM coach c JOIN seat s ON c.coach_id = s.coach_id JOIN ticket t ON s.seat_id = t.seat_id GROUP BY coach_type`);

        res.json({ success: true, data: { 
            revenue: rev, trainRankings: trainRank, revenueByMethod: byMethod, 
            ticketStatus: ts, recentBookings: recent,
            growth, peakHours: peak, classDistribution: dist
        } });
    } catch (e) { 
        console.error('Analytics Error:', e);
        res.status(500).json({ success: false, error: e.message }); 
    }
});

// ── START SERVER ──────────────────────────────────────────────────────────────
app.listen(port, () => {
    console.log(`\n🚂 Railway Reservation API running on http://localhost:${port}`);
    console.log(`   85 query endpoints + full booking/admin API ready\n`);
});

