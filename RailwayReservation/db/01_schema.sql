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
