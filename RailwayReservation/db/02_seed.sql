-- Dummy Data Seed Script for Railway Reservation System
USE railway_reservation;

SAVEPOINT InitialState;

-- 1. SEED user
INSERT INTO user (name, email, password) VALUES 
('Alice Smith', 'alice@example.com', 'hash123'),
('Bob Jones', 'bob@example.com', 'hash123'),
('Charlie Brown', 'charlie@example.com', 'hash123'),
('Admin User', 'admin@example.com', 'hash123');

-- 2. SEED admin
INSERT INTO admin (user_id, access_level, department) VALUES 
(4, 'SUPER_ADMIN', 'IT_OPERATIONS');

-- 3. SEED passenger
INSERT INTO passenger (user_id, age, gender) VALUES 
(1, 28, 'FEMALE'),
(2, 35, 'MALE'),
(3, 22, 'MALE');

-- 4. SEED train
INSERT INTO train (train_name, source, destination, status) VALUES 
('Express 101', 'New York', 'Boston', 'ACTIVE'),
('Fast 202', 'Boston', 'Washington', 'ACTIVE'),
('Night 303', 'Washington', 'New York', 'ACTIVE');

-- 5. SEED schedule
INSERT INTO schedule (train_id, dep_time, arr_time) VALUES 
(1, '2026-05-01 08:00:00', '2026-05-01 12:00:00'),
(2, '2026-05-02 14:00:00', '2026-05-02 18:30:00'),
(3, '2026-05-03 22:00:00', '2026-05-04 06:00:00');

-- 6. SEED coach
INSERT INTO coach (train_id, coach_type) VALUES 
(1, 'AC'), (1, 'SLEEPER'), (1, 'GENERAL'),
(2, 'AC'), (2, 'SLEEPER'), (3, 'SLEEPER');

-- 7. SEED specific coaches
INSERT INTO ac (coach_id, ac_tier) VALUES (1, '2A'), (4, '1A');
INSERT INTO sleeper (coach_id, has_blankets) VALUES (2, TRUE), (5, FALSE), (6, TRUE);
INSERT INTO general (coach_id, is_unreserved) VALUES (3, TRUE);

-- 8. SEED seat
INSERT INTO seat (coach_id) VALUES 
(1), (1), (1), -- AC seats
(2), (2), (2), -- Sleeper seats
(6), (6);      -- Night train sleeper

-- 9. SEED specific seats
INSERT INTO up (seat_id, window_side) VALUES (1, TRUE), (4, FALSE);
INSERT INTO mb (seat_id, has_charging_port) VALUES (2, TRUE), (5, TRUE);
INSERT INTO lb (seat_id, window_side) VALUES (3, TRUE), (6, FALSE);

-- 10. SEED booking
INSERT INTO booking (user_id, train_id, schedule_id) VALUES 
(1, 1, 1),
(2, 2, 2),
(3, 3, 3),
(1, 1, 1); -- Alice books another one

-- 11. SEED payment
INSERT INTO payment (booking_id, amount, payment_method, payment_status) VALUES 
(1, 150.00, 'CREDIT_CARD', 'COMPLETED'),
(2, 80.50, 'DEBIT_CARD', 'COMPLETED'),
(3, 120.00, 'UPI', 'REFUNDED'),
(4, 150.00, 'NET_BANKING', 'COMPLETED');

-- 12. SEED specific payments
INSERT INTO online (payment_id, gateway_name, transaction_ref) VALUES 
(1, 'Stripe', 'txn_101'),
(2, 'PayPal', 'txn_102'),
(4, 'Razorpay', 'txn_104');

INSERT INTO refund (payment_id, refund_percentage, processed_date) VALUES 
(3, 100.00, '2026-06-01 10:00:00');

-- 13. SEED cancellation
INSERT INTO cancellation (payment_id, reason) VALUES 
(3, 'Changed travel plans');

-- 14. SEED ticket
INSERT INTO ticket (booking_id, seat_id, passenger_name) VALUES 
(1, 1, 'Alice Smith'),
(2, 4, 'Bob Jones'),
(3, 8, 'Charlie Brown'),
(4, 3, 'David Smith');

-- 15. SEED specific tickets
INSERT INTO confirm (ticket_id) VALUES (1), (2), (4);
INSERT INTO cancelled (ticket_id, cancellation_fee) VALUES (3, 10.00);

-- Done seeding.
