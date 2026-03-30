CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    roll_no VARCHAR(50),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('student', 'librarian')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    rack_location VARCHAR(50),
    cover_url TEXT DEFAULT 'https://picsum.photos/id/1/100/140',
    available_copies INT DEFAULT 1,
    total_copies INT DEFAULT 1,
    isbn VARCHAR(50),
    publication_year VARCHAR(10),
    description TEXT,
    publisher VARCHAR(255),
    pages INT,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    status VARCHAR(50) CHECK (status IN ('pending', 'approved', 'rejected', 'returned')) DEFAULT 'pending',
    request_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    return_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS study_rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    capacity INT NOT NULL,
    facilities TEXT,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS room_bookings (
    id SERIAL PRIMARY KEY,
    room_id INT REFERENCES study_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    booking_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) CHECK (status IN ('pending', 'approved', 'rejected', 'completed')) DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS faculty_requests (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    faculty_name VARCHAR(255),
    department VARCHAR(255),
    book_title VARCHAR(255) NOT NULL,
    reason TEXT,
    status VARCHAR(50) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    request_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
