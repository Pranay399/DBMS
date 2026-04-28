-- Railway Reservation System Schema (Mapped rigidly from ER Diagram)
-- 22 Tables covering all Entities and Subclasses

CREATE DATABASE IF NOT EXISTS railway_reservation;
USE railway_reservation;

-- 1. BASE ENTITY: USER
CREATE TABLE IF NOT EXISTS user (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. SUBCLASS ENTITY: ADMIN (Inherits from USER)
CREATE TABLE IF NOT EXISTS admin (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    access_level VARCHAR(50) NOT NULL,
    department VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- 3. SUBCLASS ENTITY: PASSENGER (Inherits from USER)
CREATE TABLE IF NOT EXISTS passenger (
    passenger_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    age INT,
    gender VARCHAR(10),
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- 4. BASE ENTITY: TRAIN
CREATE TABLE IF NOT EXISTS train (
    train_id INT AUTO_INCREMENT PRIMARY KEY,
    train_name VARCHAR(100) NOT NULL,
    source VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE'
);

-- 5. ENTITY: SCHEDULE (Related to TRAIN)
CREATE TABLE IF NOT EXISTS schedule (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    train_id INT NOT NULL,
    dep_time DATETIME NOT NULL,
    arr_time DATETIME NOT NULL,
    FOREIGN KEY (train_id) REFERENCES train(train_id) ON DELETE CASCADE
);

-- 6. BASE ENTITY: COACH (Related to TRAIN)
CREATE TABLE IF NOT EXISTS coach (
    coach_id INT AUTO_INCREMENT PRIMARY KEY,
    train_id INT NOT NULL,
    coach_type VARCHAR(50) NOT NULL,
    FOREIGN KEY (train_id) REFERENCES train(train_id) ON DELETE CASCADE
);

-- 7. SUBCLASS ENTITY: AC
CREATE TABLE IF NOT EXISTS ac (
    coach_id INT PRIMARY KEY,
    ac_tier VARCHAR(10) DEFAULT '3A', -- Example: 1A, 2A, 3A
    FOREIGN KEY (coach_id) REFERENCES coach(coach_id) ON DELETE CASCADE
);

-- 8. SUBCLASS ENTITY: SLEEPER
CREATE TABLE IF NOT EXISTS sleeper (
    coach_id INT PRIMARY KEY,
    has_blankets BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (coach_id) REFERENCES coach(coach_id) ON DELETE CASCADE
);

-- 9. SUBCLASS ENTITY: GENERAL
CREATE TABLE IF NOT EXISTS general (
    coach_id INT PRIMARY KEY,
    is_unreserved BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (coach_id) REFERENCES coach(coach_id) ON DELETE CASCADE
);

-- 10. BASE ENTITY: SEAT (Related to COACH)
CREATE TABLE IF NOT EXISTS seat (
    seat_id INT AUTO_INCREMENT PRIMARY KEY,
    coach_id INT NOT NULL,
    FOREIGN KEY (coach_id) REFERENCES coach(coach_id) ON DELETE CASCADE
);

-- 11. SUBCLASS ENTITY: UP (Upper Berth)
CREATE TABLE IF NOT EXISTS up (
    seat_id INT PRIMARY KEY,
    window_side BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (seat_id) REFERENCES seat(seat_id) ON DELETE CASCADE
);

-- 12. SUBCLASS ENTITY: MB (Middle Berth)
CREATE TABLE IF NOT EXISTS mb (
    seat_id INT PRIMARY KEY,
    has_charging_port BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (seat_id) REFERENCES seat(seat_id) ON DELETE CASCADE
);

-- 13. SUBCLASS ENTITY: LB (Lower Berth)
CREATE TABLE IF NOT EXISTS lb (
    seat_id INT PRIMARY KEY,
    window_side BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (seat_id) REFERENCES seat(seat_id) ON DELETE CASCADE
);

-- 14. ENTITY: BOOKING 
-- Relationships: connects USER, TRAIN, SCHEDULE
CREATE TABLE IF NOT EXISTS booking (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    train_id INT NOT NULL,
    schedule_id INT NOT NULL,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(user_id),
    FOREIGN KEY (train_id) REFERENCES train(train_id),
    FOREIGN KEY (schedule_id) REFERENCES schedule(schedule_id)
);

-- 15. BASE ENTITY: PAYMENT (Related to BOOKING)
CREATE TABLE IF NOT EXISTS payment (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    FOREIGN KEY (booking_id) REFERENCES booking(booking_id) ON DELETE CASCADE
);

-- 16. SUBCLASS ENTITY: ONLINE (Inherits PAYMENT)
CREATE TABLE IF NOT EXISTS online (
    payment_id INT PRIMARY KEY,
    gateway_name VARCHAR(50),
    transaction_ref VARCHAR(100),
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id) ON DELETE CASCADE
);

-- 17. SUBCLASS ENTITY: REFUND (Inherits PAYMENT)
CREATE TABLE IF NOT EXISTS refund (
    payment_id INT PRIMARY KEY,
    refund_percentage DECIMAL(5, 2),
    processed_date TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id) ON DELETE CASCADE
);

-- 18. ENTITY: CANCELLATION (1-1 with PAYMENT)
CREATE TABLE IF NOT EXISTS cancellation (
    cancellation_id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id INT UNIQUE NOT NULL,
    reason VARCHAR(255),
    cancel_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id) ON DELETE CASCADE
);

-- 19. BASE ENTITY: TICKET (Related to BOOKING and SEAT)
CREATE TABLE IF NOT EXISTS ticket (
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    seat_id INT NOT NULL,
    passenger_name VARCHAR(100) NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES booking(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id) REFERENCES seat(seat_id)
);

-- 20. SUBCLASS ENTITY: CONFIRM
CREATE TABLE IF NOT EXISTS confirm (
    ticket_id INT PRIMARY KEY,
    confirmation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES ticket(ticket_id) ON DELETE CASCADE
);

-- 21. SUBCLASS ENTITY: WAITING
CREATE TABLE IF NOT EXISTS waiting (
    ticket_id INT PRIMARY KEY,
    waiting_number INT NOT NULL,
    FOREIGN KEY (ticket_id) REFERENCES ticket(ticket_id) ON DELETE CASCADE
);

-- 22. SUBCLASS ENTITY: CANCELLED (Ticket status)
CREATE TABLE IF NOT EXISTS cancelled (
    ticket_id INT PRIMARY KEY,
    cancellation_fee DECIMAL(10, 2),
    FOREIGN KEY (ticket_id) REFERENCES ticket(ticket_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- FUNCTIONS, PROCEDURES, AND TRIGGERS
-- ---------------------------------------------------------

DELIMITER //

-- Function: Calculate age category
DROP FUNCTION IF EXISTS GetAgeCategory //
CREATE FUNCTION GetAgeCategory(p_age INT) RETURNS VARCHAR(20) DETERMINISTIC
BEGIN
    DECLARE cat VARCHAR(20);
    IF p_age < 18 THEN SET cat = 'Minor';
    ELSEIF p_age >= 60 THEN SET cat = 'Senior';
    ELSE SET cat = 'Adult';
    END IF;
    RETURN cat;
END //

-- Procedure: Process Refund
DROP PROCEDURE IF EXISTS ProcessRefund //
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

-- Procedure: Get Booked Seats
DROP PROCEDURE IF EXISTS GetBookedSeats //
CREATE PROCEDURE GetBookedSeats(IN p_train_id INT)
BEGIN
    SELECT s.seat_id, c.coach_type 
    FROM seat s 
    JOIN coach c ON s.coach_id = c.coach_id
    WHERE c.train_id = p_train_id AND s.seat_id IN (SELECT seat_id FROM ticket);
END //

-- Trigger: Prevent negative payment amount
DROP TRIGGER IF EXISTS trg_check_payment_amount //
CREATE TRIGGER trg_check_payment_amount BEFORE INSERT ON payment
FOR EACH ROW
BEGIN
    IF NEW.amount < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment amount cannot be negative';
    END IF;
END //

-- Trigger: Log cancellations
CREATE TABLE IF NOT EXISTS cancellation_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id INT,
    cancel_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) //

DROP TRIGGER IF EXISTS trg_log_cancellations //
CREATE TRIGGER trg_log_cancellations AFTER INSERT ON cancellation
FOR EACH ROW
BEGIN
    INSERT INTO cancellation_log (payment_id) VALUES (NEW.payment_id);
END //

DELIMITER ;

-- ---------------------------------------------------------
-- PART K: ADVANCED ANALYTICS VIEWS (40 NEW FEATURES)
-- ---------------------------------------------------------

-- 1. Monthly Revenue Analytics
CREATE OR REPLACE VIEW View_MonthlyRevenue AS
SELECT MONTH(booking_date) as month, SUM(p.amount) as revenue
FROM booking b JOIN payment p ON b.booking_id = p.booking_id
GROUP BY month;

-- 2. Busy Station Arrivals
CREATE OR REPLACE VIEW View_BusyStations AS
SELECT destination, COUNT(*) as arrivals FROM train GROUP BY destination;

-- 3. Power Users (Top 5)
CREATE OR REPLACE VIEW View_PowerUsers AS
SELECT u.name, COUNT(b.booking_id) as booking_count
FROM user u JOIN booking b ON u.user_id = b.user_id
GROUP BY u.user_id ORDER BY booking_count DESC LIMIT 5;

-- 4. Age Category Revenue
CREATE OR REPLACE VIEW View_AgeCategoryRevenue AS
SELECT GetAgeCategory(p.age) as age_group, SUM(pay.amount) as revenue
FROM passenger p JOIN booking b ON p.user_id = b.user_id
JOIN payment pay ON b.booking_id = pay.booking_id GROUP BY age_group;

-- 5. Coach Occupancy Report
CREATE OR REPLACE VIEW View_CoachOccupancy AS
SELECT c.coach_id, c.coach_type, 
       (SELECT COUNT(*) FROM seat s WHERE s.coach_id = c.coach_id) as total_seats,
       (SELECT COUNT(*) FROM ticket t JOIN seat s ON t.seat_id = s.seat_id WHERE s.coach_id = c.coach_id) as booked_seats
FROM coach c;

-- 6. Refund Rates per Train
CREATE OR REPLACE VIEW View_TrainRefundRates AS
SELECT tr.train_name, (COUNT(r.payment_id) / COUNT(p.payment_id)) * 100 as refund_rate
FROM train tr JOIN booking b ON tr.train_id = b.train_id
JOIN payment p ON b.booking_id = p.booking_id
LEFT JOIN refund r ON p.payment_id = r.payment_id
GROUP BY tr.train_id;

-- 7. Frequent Passenger Manifest
CREATE OR REPLACE VIEW View_FrequentPassengers AS
SELECT passenger_name, COUNT(*) as frequency FROM ticket GROUP BY passenger_name;

-- 8. Department Performance
CREATE OR REPLACE VIEW View_DeptRevenue AS
SELECT a.department, SUM(p.amount) as total_revenue
FROM admin a JOIN user u ON a.user_id = u.user_id
CROSS JOIN booking b -- Simulation
JOIN payment p ON b.booking_id = p.booking_id
GROUP BY a.department;

-- 9. Journey Duration Analytics
CREATE OR REPLACE VIEW View_JourneyDurations AS
SELECT tr.train_name, AVG(TIMESTAMPDIFF(MINUTE, s.dep_time, s.arr_time)) as avg_duration_mins
FROM train tr JOIN schedule s ON tr.train_id = s.train_id GROUP BY tr.train_id;

-- 10. AC vs Non-AC Distribution
CREATE OR REPLACE VIEW View_ACDistribution AS
SELECT coach_type, (COUNT(*) / (SELECT COUNT(*) FROM ticket)) * 100 as percentage
FROM coach c JOIN seat s ON c.coach_id = s.coach_id
JOIN ticket t ON s.seat_id = t.seat_id GROUP BY coach_type;

-- 11. Most Expensive Transactions
CREATE OR REPLACE VIEW View_TopPayments AS
SELECT * FROM payment ORDER BY amount DESC LIMIT 10;

-- 12. User Diversity Ranking
CREATE OR REPLACE VIEW View_UserTravelDiversity AS
SELECT user_id, COUNT(DISTINCT train_id) as unique_trains
FROM booking GROUP BY user_id;

-- 13. Average Lead Time (Booking to Departure)
CREATE OR REPLACE VIEW View_BookingLeadTime AS
SELECT AVG(TIMESTAMPDIFF(HOUR, booking_date, dep_time)) as avg_lead_hours
FROM booking b JOIN schedule s ON b.schedule_id = s.schedule_id;

-- 14. Peak Booking Hours
CREATE OR REPLACE VIEW View_PeakHours AS
SELECT HOUR(booking_date) as booking_hour, COUNT(*) as booking_count
FROM booking GROUP BY booking_hour;

-- 15. Train Route Counts
CREATE OR REPLACE VIEW View_TrainRouteCounts AS
SELECT train_name, COUNT(DISTINCT source) as unique_sources, COUNT(DISTINCT destination) as unique_destinations
FROM train GROUP BY train_name;

-- 16. Pure Passengers (Never Cancelled)
CREATE OR REPLACE VIEW View_ReliableUsers AS
SELECT name FROM user WHERE user_id NOT IN (
    SELECT b.user_id FROM booking b JOIN ticket t ON b.booking_id = t.ticket_id
    JOIN cancelled c ON t.ticket_id = c.ticket_id
);

-- 17. Ghost Trains (Zero Bookings)
CREATE OR REPLACE VIEW View_GhostTrains AS
SELECT train_name FROM train WHERE train_id NOT IN (SELECT train_id FROM booking);

-- 18. Average Passenger Age per Train
CREATE OR REPLACE VIEW View_TrainAvgAge AS
SELECT tr.train_name, AVG(p.age) as average_age
FROM train tr JOIN booking b ON tr.train_id = b.train_id
JOIN passenger p ON b.user_id = p.user_id GROUP BY tr.train_id;

-- 19. Gateway High-Value Utilization
CREATE OR REPLACE VIEW View_GatewayHighValue AS
SELECT gateway_name, COUNT(*) as high_value_count
FROM online o JOIN payment p ON o.payment_id = p.payment_id 
WHERE p.amount > 150 GROUP BY gateway_name;

-- 20. Total Cancellation Fees
CREATE OR REPLACE VIEW View_CancellationRevenue AS
SELECT SUM(cancellation_fee) as total_fees_collected FROM cancelled;

-- 21. Multi-Ticket Bookings
CREATE OR REPLACE VIEW View_BatchBookings AS
SELECT booking_id, COUNT(*) as ticket_count FROM ticket GROUP BY booking_id HAVING ticket_count > 1;

-- 22. Gateway Refund Efficiency
CREATE OR REPLACE VIEW View_GatewayRefunds AS
SELECT gateway_name, AVG(amount) as avg_refund_amount
FROM online o JOIN payment p ON o.payment_id = p.payment_id
WHERE p.payment_status = 'REFUNDED' GROUP BY gateway_name;

-- 23. Next 24h Schedule
CREATE OR REPLACE VIEW View_Next24Hours AS
SELECT tr.train_name, s.dep_time FROM train tr JOIN schedule s ON tr.train_id = s.train_id
WHERE s.dep_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR);

-- 24. Gender Demographics
CREATE OR REPLACE VIEW View_GenderStats AS
SELECT gender, COUNT(*) as count FROM passenger GROUP BY gender;

-- 25. System Uptime Metrics
CREATE OR REPLACE VIEW View_SystemUptime AS
SELECT DATEDIFF(NOW(), MIN(created_at)) as days_since_launch FROM user;

-- 26. Daily Booking Volume
CREATE OR REPLACE VIEW View_DailyBookings AS
SELECT DATE(booking_date) as b_date, COUNT(*) as count FROM booking GROUP BY b_date;

-- 27. Seat Efficiency (Revenue per Seat)
CREATE OR REPLACE VIEW View_SeatRevenue AS
SELECT s.seat_id, SUM(p.amount) as total_revenue
FROM seat s LEFT JOIN ticket t ON s.seat_id = t.seat_id
LEFT JOIN payment p ON t.booking_id = p.booking_id GROUP BY s.seat_id;

-- 28. Destination Popularity Ranking
CREATE OR REPLACE VIEW View_PopularDestinations AS
SELECT destination, COUNT(*) as bookings FROM train tr 
JOIN booking b ON tr.train_id = b.train_id GROUP BY destination;

-- 29. Repeat Travelers
CREATE OR REPLACE VIEW View_RepeatTravelers AS
SELECT user_id, train_id, COUNT(*) as trip_count FROM booking GROUP BY user_id, train_id HAVING trip_count > 1;

-- 30. Overlapping Schedules
CREATE OR REPLACE VIEW View_ScheduleConflicts AS
SELECT s1.train_id, s1.schedule_id as sch1, s2.schedule_id as sch2
FROM schedule s1 JOIN schedule s2 ON s1.train_id = s2.train_id
WHERE s1.schedule_id < s2.schedule_id AND s1.arr_time > s2.dep_time;

-- 31. Booking Source Diversity
CREATE OR REPLACE VIEW View_SourcePopularity AS
SELECT source, COUNT(*) as departures FROM train tr 
JOIN booking b ON tr.train_id = b.train_id GROUP BY source;

-- 32. Revenue by Payment Method
CREATE OR REPLACE VIEW View_MethodRevenue AS
SELECT payment_method, SUM(amount) as revenue FROM payment GROUP BY payment_method;

-- 33. Confirmed vs Waiting Totals
CREATE OR REPLACE VIEW View_TicketStatusCounts AS
SELECT 
    (SELECT COUNT(*) FROM confirm) as confirmed,
    (SELECT COUNT(*) FROM waiting) as waitlisted;

-- 34. Admin Access Levels
CREATE OR REPLACE VIEW View_AdminAccess AS
SELECT access_level, COUNT(*) as count FROM admin GROUP BY access_level;

-- 35. Coach Capacity Utilization
CREATE OR REPLACE VIEW View_CapacityUtil AS
SELECT coach_id, (SELECT COUNT(*) FROM ticket t JOIN seat s ON t.seat_id = s.seat_id WHERE s.coach_id = c.coach_id) / (SELECT COUNT(*) FROM seat s WHERE s.coach_id = c.coach_id) * 100 as utilization
FROM coach c;

-- 36. User Registration Trend
CREATE OR REPLACE VIEW View_UserGrowth AS
SELECT DATE(created_at) as reg_date, COUNT(*) as new_users FROM user GROUP BY reg_date;

-- 37. Average Ticket Price per Train
CREATE OR REPLACE VIEW View_TrainAvgPrice AS
SELECT tr.train_name, AVG(p.amount) as avg_price
FROM train tr JOIN booking b ON tr.train_id = b.train_id
JOIN payment p ON b.booking_id = p.booking_id GROUP BY tr.train_id;

-- 38. Frequent Route Pairs
CREATE OR REPLACE VIEW View_PopularRoutes AS
SELECT source, destination, COUNT(*) as frequency FROM train GROUP BY source, destination;

-- 39. Refund Reason Cloud (Simulation)
CREATE OR REPLACE VIEW View_RefundReasons AS
SELECT reason, COUNT(*) as count FROM cancellation GROUP BY reason;

-- 40. Full System Summary View
CREATE OR REPLACE VIEW View_SystemSummary AS
SELECT 
    (SELECT COUNT(*) FROM user) as total_users,
    (SELECT COUNT(*) FROM train) as total_trains,
    (SELECT COUNT(*) FROM booking) as total_bookings,
    (SELECT SUM(amount) FROM payment WHERE payment_status = 'COMPLETED') as net_revenue;
