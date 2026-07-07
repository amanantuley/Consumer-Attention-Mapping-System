-- Schema dump for CAMS (milestone 1)
-- Tables: roles, users, stores, shelves

CREATE TABLE roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role_id VARCHAR(50) NOT NULL REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stores (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    address VARCHAR(255) DEFAULT '',
    floor_plan_url VARCHAR(512),
    location VARCHAR(255),
    store_metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shelves (
    id VARCHAR(36) PRIMARY KEY,
    store_id VARCHAR(36) NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    shelf_name VARCHAR(255) NOT NULL,
    zone_coordinates JSON,
    zone_id INTEGER,
    name VARCHAR(255),
    position_x FLOAT DEFAULT 0.0,
    position_y FLOAT DEFAULT 0.0,
    position_z FLOAT DEFAULT 0.0,
    width FLOAT DEFAULT 0.0,
    height FLOAT DEFAULT 0.0,
    depth FLOAT DEFAULT 0.0,
    camera_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Example role inserts
INSERT INTO roles (id, name) VALUES ('SuperAdmin', 'SuperAdmin') ON CONFLICT DO NOTHING;
INSERT INTO roles (id, name) VALUES ('StoreManager', 'StoreManager') ON CONFLICT DO NOTHING;
INSERT INTO roles (id, name) VALUES ('Analyst', 'Analyst') ON CONFLICT DO NOTHING;
