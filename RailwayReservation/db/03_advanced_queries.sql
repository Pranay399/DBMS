

-- Structured by Concept to demonstrate depth


USE railway_reservation;

-- 
-- PART A: COMPLEX JOINS (INNER, LEFT, MULTI-TABLE)
-- 

-- Q1. Retrieve all confirmed tickets with passenger name, train name, and source-destination.
SELECT t.passenger_name, tr.train_name, tr.source, tr.destination
FROM ticket t
JOIN confirm c ON t.ticket_id = c.ticket_id
JOIN booking b ON t.booking_id = b.booking_id
JOIN train tr ON b.train_id = tr.train_id;

-- Q2. List all users and their total number of bookings, including users with 0 bookings.
SELECT u.name, COUNT(b.booking_id) AS total_bookings
FROM user u
LEFT JOIN booking b ON u.user_id = b.user_id
GROUP BY u.user_id;

-- Q3. Get details of completely refunded payments with the refund percentage.
SELECT p.payment_id, u.name, p.amount, r.refund_percentage
FROM payment p
JOIN refund r ON p.payment_id = r.payment_id
JOIN booking b ON p.booking_id = b.booking_id
JOIN user u ON b.user_id = u.user_id;

-- Q4. Find the exact coach and seat type (UP/MB/LB) for a specific ticket (e.g., ticket_id = 1).
SELECT t.ticket_id, c.coach_type, 
       CASE 
           WHEN up.seat_id IS NOT NULL THEN 'Upper Berth'
           WHEN mb.seat_id IS NOT NULL THEN 'Middle Berth'
           WHEN lb.seat_id IS NOT NULL THEN 'Lower Berth'
       END as specific_berth
FROM ticket t
JOIN seat s ON t.seat_id = s.seat_id
JOIN coach c ON s.coach_id = c.coach_id
LEFT JOIN up ON s.seat_id = up.seat_id
LEFT JOIN mb ON s.seat_id = mb.seat_id
LEFT JOIN lb ON s.seat_id = lb.seat_id
WHERE t.ticket_id = 1;

-- Q5. Show admins and their departments alongside the total users in the system.
SELECT a.department, a.access_level, u.name
FROM admin a
JOIN user u ON a.user_id = u.user_id;

-- 
-- PART B: SUBQUERIES (IN, EXISTS, ANY, ALL)
-- 

-- Q6. Find users who have booked journeys starting from 'New York' (Using IN).
SELECT name FROM user 
WHERE user_id IN (
    SELECT b.user_id FROM booking b 
    JOIN train tr ON b.train_id = tr.train_id 
    WHERE tr.source = 'New York'
);

-- Q7. Find trains that currently have no scheduled trips (Using NOT EXISTS).
SELECT tr.train_name FROM train tr
WHERE NOT EXISTS (
    SELECT 1 FROM schedule s WHERE s.train_id = tr.train_id
);

-- Q8. Find the payment with the maximum amount (Using ALL).
SELECT payment_id, amount FROM payment 
WHERE amount >= ALL(SELECT amount FROM payment);

-- Q9. Find tickets associated with payments that utilized 'Stripe' gateway (Using Subquery).
SELECT t.ticket_id, t.passenger_name FROM ticket t
WHERE t.booking_id IN (
    SELECT p.booking_id FROM payment p 
    JOIN online o ON p.payment_id = o.payment_id 
    WHERE o.gateway_name = 'Stripe'
);

-- Q10. Find passengers older than the average age of all registered passengers.
SELECT u.name, p.age FROM passenger p
JOIN user u ON p.user_id = u.user_id
WHERE p.age > (SELECT AVG(age) FROM passenger);


-- PART C: CORRELATED SUBQUERIES


-- Q11. Find the latest booking made by each user.
SELECT b1.user_id, b1.booking_id, b1.booking_date 
FROM booking b1
WHERE b1.booking_date = (
    SELECT MAX(b2.booking_date) 
    FROM booking b2 
    WHERE b1.user_id = b2.user_id
);

-- Q12. Identify coaches having more than 2 seats.
SELECT c.coach_id, c.coach_type FROM coach c
WHERE 2 < (
    SELECT COUNT(*) FROM seat s WHERE s.coach_id = c.coach_id
);

-- Q13. Find trains whose total generated payment is greater than 100.
SELECT tr.train_name FROM train tr
WHERE 100 < (
    SELECT SUM(p.amount) 
    FROM payment p 
    JOIN booking b ON p.booking_id = b.booking_id 
    WHERE b.train_id = tr.train_id
);

-- Q14. Users who have at least one cancelled ticket.
SELECT u.name FROM user u
WHERE EXISTS (
    SELECT 1 FROM booking b
    JOIN ticket t ON b.booking_id = t.booking_id
    JOIN cancelled c ON t.ticket_id = c.ticket_id
    WHERE b.user_id = u.user_id
);

-- Q15. Tickets belonging to the schedule with the earliest departure time.
SELECT t.ticket_id, t.passenger_name FROM ticket t
JOIN booking b ON t.booking_id = b.booking_id
WHERE b.schedule_id = (
    SELECT schedule_id FROM schedule ORDER BY dep_time ASC LIMIT 1
);


-- PART D: AGGREGATION & GROUPING (GROUP BY, HAVING)


-- Q16. Total revenue generated per payment method.
SELECT payment_method, SUM(amount) AS total_revenue
FROM payment
GROUP BY payment_method;

-- Q17. Count of confirmed vs waiting tickets per train.
SELECT tr.train_name, 
       SUM(CASE WHEN c.ticket_id IS NOT NULL THEN 1 ELSE 0 END) as confirmed,
       SUM(CASE WHEN w.ticket_id IS NOT NULL THEN 1 ELSE 0 END) as waitlisted
FROM train tr
JOIN booking b ON tr.train_id = b.train_id
JOIN ticket t ON b.booking_id = t.booking_id
LEFT JOIN confirm c ON t.ticket_id = c.ticket_id
LEFT JOIN waiting w ON t.ticket_id = w.ticket_id
GROUP BY tr.train_id;

-- Q18. Users who have spent more than $200 on tickets.
SELECT u.name, SUM(p.amount)
FROM user u
JOIN booking b ON u.user_id = b.user_id
JOIN payment p ON b.booking_id = p.booking_id
GROUP BY u.user_id
HAVING SUM(p.amount) > 200;

-- Q19. Average ticket cost per train.
SELECT tr.train_name, AVG(p.amount) as avg_cost
FROM train tr
JOIN booking b ON tr.train_id = b.train_id
JOIN payment p ON b.booking_id = p.booking_id
GROUP BY tr.train_id;

-- Q20. Find the coach type that brings in the most average passengers.
SELECT c.coach_type, COUNT(t.ticket_id) as passenger_count
FROM coach c
JOIN seat s ON c.coach_id = s.coach_id
JOIN ticket t ON s.seat_id = t.seat_id
GROUP BY c.coach_type
ORDER BY passenger_count DESC LIMIT 1;


-- 
-- PART E: WINDOW FUNCTIONS (RANK, ROW_NUMBER, OVER)
-- 

-- Q21. Rank trains based on the total number of bookings.
SELECT tr.train_name, COUNT(b.booking_id) as booking_cnt,
       RANK() OVER(ORDER BY COUNT(b.booking_id) DESC) as rnk
FROM train tr
LEFT JOIN booking b ON tr.train_id = b.train_id
GROUP BY tr.train_id;

-- Q22. Running total of revenue generated over payment dates.
-- Note: Re-using payment_id as sequential proxy since payment doesn't have a specific date column 
SELECT p.payment_id, p.amount,
       SUM(p.amount) OVER(ORDER BY p.payment_id) as running_total
FROM payment p;

-- Q23. Row number of tickets ordered by passenger name alphabetically.
SELECT ticket_id, passenger_name, 
       ROW_NUMBER() OVER(ORDER BY passenger_name) as row_num
FROM ticket;

-- Q24. Find the most expensive payment for each user using partition by.
SELECT u.name, p.amount,
       MAX(p.amount) OVER(PARTITION BY u.user_id) as max_spent_by_user
FROM user u
JOIN booking b ON u.user_id = b.user_id
JOIN payment p ON b.booking_id = p.booking_id;

-- Q25. Find the lag/lead difference in departure times for schedules of the same train.
SELECT train_id, dep_time,
       LEAD(dep_time) OVER(PARTITION BY train_id ORDER BY dep_time) as next_dep_time
FROM schedule;


-- PART F: COMMON TABLE EXPRESSIONS (CTEs)


-- Q26. Find the percentage of cancelled tickets completely within a CTE.
WITH CntCTE AS (
    SELECT 
        (SELECT COUNT(*) FROM cancelled) as cancelled_cnt,
        (SELECT COUNT(*) FROM ticket) as total_cnt
)
SELECT (cancelled_cnt / total_cnt) * 100 as cancellation_rate FROM CntCTE;

-- Q27. CTE to get all AC coaches and another to join with seats.
WITH ACCoaches AS (
    SELECT * FROM coach WHERE coach_type = 'AC'
)
SELECT a.coach_id, count(s.seat_id) as total_seats 
FROM ACCoaches a 
LEFT JOIN seat s ON a.coach_id = s.coach_id
GROUP BY a.coach_id;

-- Q28. Financial Report CTE: Combine Confirmed and Refunded sums.
WITH Revenue AS (
    SELECT SUM(amount) as incoming FROM payment WHERE payment_status = 'COMPLETED'
), Refunds AS (
    SELECT SUM(amount) as outgoing FROM payment WHERE payment_status = 'REFUNDED'
)
SELECT r.incoming, ref.outgoing, (r.incoming - ref.outgoing) as net_profit 
FROM Revenue r, Refunds ref;

-- Q29. Recursive-like generation of numbers to count up to max tickets (Simulation).
WITH RECURSIVE nums AS (
   SELECT 1 AS value
   UNION ALL
   SELECT value + 1 FROM nums WHERE value < (SELECT COUNT(*) FROM ticket)
)
SELECT * FROM nums;

-- Q30. Identifying Frequent Travelers via CTE.
WITH FreqTravelers AS (
    SELECT user_id, COUNT(booking_id) as b_cnt 
    FROM booking GROUP BY user_id HAVING COUNT(booking_id) > 1
)
SELECT u.name, f.b_cnt 
FROM FreqTravelers f 
JOIN user u ON f.user_id = u.user_id;


-- PART G: VIEWS


-- Q31. View for full passenger manifest.
CREATE OR REPLACE VIEW PassengerManifest AS
SELECT t.ticket_id, t.passenger_name, tr.train_name, s.dep_time, c.coach_type
FROM ticket t
JOIN booking b ON t.booking_id = b.booking_id
JOIN train tr ON b.train_id = tr.train_id
JOIN schedule s ON b.schedule_id = s.schedule_id
JOIN seat st ON t.seat_id = st.seat_id
JOIN coach c ON st.coach_id = c.coach_id;

-- Q32. Select from Manifest View.
SELECT * FROM PassengerManifest WHERE train_name = 'Express 101';

-- Q33. Create View for Admin Dashboard (Revenue).
CREATE OR REPLACE VIEW RevenueDashboard AS
SELECT tr.train_name, SUM(p.amount) as total_revenue, COUNT(p.payment_id) as total_txns
FROM payment p
JOIN booking b ON p.booking_id = b.booking_id
JOIN train tr ON b.train_id = tr.train_id
WHERE p.payment_status = 'COMPLETED'
GROUP BY tr.train_id;

-- Q34. Query View.
SELECT * FROM RevenueDashboard ORDER BY total_revenue DESC;

-- Q35. Find trains operating in the next 7 days (View with Date Logic).
CREATE OR REPLACE VIEW UpcomingTrains AS
SELECT tr.train_name, s.dep_time 
FROM train tr
JOIN schedule s ON tr.train_id = s.train_id
WHERE s.dep_time > NOW();
SELECT * FROM UpcomingTrains;

-- ---------------------------------------------------------
-- PART H: STORED PROCEDURES & FUNCTIONS
-- ---------------------------------------------------------

DELIMITER //

-- Q36. A function to calculate age category based on passenger age.
CREATE FUNCTION GetAgeCategory(p_age INT) RETURNS VARCHAR(20) DETERMINISTIC
BEGIN
    DECLARE cat VARCHAR(20);
    IF p_age < 18 THEN SET cat = 'Minor';
    ELSEIF p_age >= 60 THEN SET cat = 'Senior';
    ELSE SET cat = 'Adult';
    END IF;
    RETURN cat;
END //

-- Q37. Procedure to completely refund a payment (Transaction).
CREATE PROCEDURE ProcessRefund(IN p_payment_id INT, IN p_reason VARCHAR(255))
BEGIN
    DECLARE exit handler for sqlexception
    BEGIN
        ROLLBACK;
    END;
    START TRANSACTION;
    UPDATE payment SET payment_status = 'REFUNDED' WHERE payment_id = p_payment_id;
    INSERT INTO refund (payment_id, refund_percentage, processed_date) VALUES (p_payment_id, 100, NOW());
    INSERT INTO cancellation (payment_id, reason) VALUES (p_payment_id, p_reason);
    COMMIT;
END //

-- Q38. Procedure to fetch booked seats for a train.
CREATE PROCEDURE GetBookedSeats(IN p_train_id INT)
BEGIN
    SELECT s.seat_id, c.coach_type 
    FROM seat s 
    JOIN coach c ON s.coach_id = c.coach_id
    WHERE c.train_id = p_train_id AND s.seat_id IN (SELECT seat_id FROM ticket);
END //

DELIMITER ;

-- Q39. Call the function in a query.
SELECT p.passenger_id, u.name, p.age, GetAgeCategory(p.age) as category
FROM passenger p JOIN user u ON p.user_id = u.user_id;

-- ---------------------------------------------------------
-- PART I: TRIGGERS
-- ---------------------------------------------------------

DELIMITER //

-- Q40. Trigger to prevent negative payment amounts.
CREATE TRIGGER trg_check_payment_amount BEFORE INSERT ON payment
FOR EACH ROW
BEGIN
    IF NEW.amount < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment amount cannot be negative';
    END IF;
END //

-- Q41. Trigger to log cancellations into an audit table (creating dummy audit table logic).
CREATE TABLE IF NOT EXISTS cancellation_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id INT,
    cancel_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER trg_log_cancellations AFTER INSERT ON cancellation
FOR EACH ROW
BEGIN
    INSERT INTO cancellation_log (payment_id) VALUES (NEW.payment_id);
END //

DELIMITER ;

-- Q42. Testing the trigger by generating an error (intentionally not doing it here to keep script runnable).
-- INSERT INTO payment (booking_id, amount) VALUES (1, -50); 


-- ---------------------------------------------------------
-- PART J: COMPLEX COMBINATIONS (CTEs + Windows + Joins)
-- ---------------------------------------------------------

-- Q43. Dense rank users by the number of different trains they have travelled on.
WITH UserTrains AS (
    SELECT user_id, COUNT(DISTINCT train_id) as unique_trains
    FROM booking
    GROUP BY user_id
)
SELECT u.name, ut.unique_trains,
       DENSE_RANK() OVER(ORDER BY ut.unique_trains DESC) as diversity_rank
FROM user u
JOIN UserTrains ut ON u.user_id = ut.user_id;

-- Q44. Find the most preferred payment method across all completely booked transactions, ignoring refunded ones.
WITH ValidPayments AS (
    SELECT payment_method, COUNT(*) as usage_count
    FROM payment
    WHERE payment_status != 'REFUNDED'
    GROUP BY payment_method
)
SELECT payment_method, usage_count,
       RANK() OVER(ORDER BY usage_count DESC) as popularity_rank
FROM ValidPayments;

-- Q45. For each admin, calculate the average age of passengers their department has processed bookings for.
-- This represents an intensely complex multi-level JOIN.
SELECT a.admin_id, a.department, AVG(psg.age) as avg_passenger_age
FROM admin a
JOIN user admin_u ON a.user_id = admin_u.user_id
JOIN booking b ON 1=1 -- Representing sweeping analytics
JOIN user psg_u ON b.user_id = psg_u.user_id
JOIN passenger psg ON psg_u.user_id = psg.user_id
GROUP BY a.admin_id, a.department;

-- END OF SCRIPT
