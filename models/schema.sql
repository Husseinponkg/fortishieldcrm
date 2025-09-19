create database defaultdb;

use defaultdb;


CREATE table users(
id int primary key auto_increment,
username varchar(100),
email varchar(100),
roles ENUM('general_manager','project_manager','developer','customer_admin'),
password varchar(100),
contacts varchar(50)
);

CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL,
    user_id INT NULL,
    email VARCHAR(100) NOT NULL,
    contacts VARCHAR(50),
    service VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE activities(
id int primary key auto_increment,
customer_id int,
opportunity_id varchar(100),
task_type varchar(255),
description TEXT,
notification TEXT,
assigned_to varchar(100),
created_at TIMESTAMP,
status ENUM('pending','completed','not completed'),
foreign key(customer_id) references customers(id) on delete cascade

);
CREATE table admin(
    admin_id int primary key auto_increment,
    users_id int NULL,
    username varchar(100),
    password varchar(100),
    role ENUM('admin')default 'admin',
    foreign key(users_id) references users(id)

);
CREATE table contacts(
    id int primary key auto_increment,
    customer_id int,
    f_name varchar(100),
    l_name varchar(100),
    email varchar(100),
    phone varchar(100),
    company varchar(100),
    address varchar(100),
    service varchar(100),
    location varchar(100),
    created_at TIMESTAMP,
    foreign key(customer_id) references customers(id)
);
CREATE table deals(
    id int primary key auto_increment,
    customer_id int NULL,
    title varchar(200),
    description TEXT,
    value DECIMAL(15,2),
    stage ENUM('prospect','qualification','proposal','negotiation','closed_won','closed_lost'),
    probability INT default 0,
    dead_line TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    foreign key(customer_id)references customers(id)
);
create table projects(
    id INT primary key auto_increment,
    customer_id INT NULL,
    title VARCHAR(200),
    description TEXT,
    status ENUM('not started','in progress','completed','on hold') DEFAULT 'not started',
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_to VARCHAR(100),
    report_upload VARCHAR(255),
    foreign key(customer_id) references customers(id)
);
CREATE  table conversations(
    id int primary key auto_increment,
    customer_id int NULL,
    message TEXT,
    sender VARCHAR(100),
    notification INT(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    foreign key(customer_id) references customers(id) on delete cascade
);
CREATE TABLE report (
    report_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NULL,
    project_id INT NULL,
    title VARCHAR(200) NOT NULL,
    task_type VARCHAR(255) NOT NULL,
    task_status ENUM('pending', 'in progress', 'completed', 'on hold') DEFAULT 'pending',
    description TEXT,
    file_extension ENUM('pdf', 'txt', 'docx', 'doc', 'rtf', 'odt') DEFAULT 'pdf',
    
    -- File storage information
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_size BIGINT,
    
    signature VARCHAR(100),
    created_by INT NULL, -- Reference to user who created the report
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes for better performance
    INDEX idx_customer_id (customer_id),
    INDEX idx_project_id (project_id),
    INDEX idx_task_status (task_status),
    INDEX idx_created_at (created_at),
    INDEX idx_file_extension (file_extension)
);

-- Table to store customer phone numbers for SMS communication


-- Table to store WhatsApp logs
create table sms(
    id int primary key auto_increment,
    message varchar(500),
    phone_numbers varchar(100),  
    status ENUM('sent','failed','delivered') DEFAULT 'sent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    customer_id int NULL,
    project_id int NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE TABLE emails(
    id int primary key auto_increment,
    customer_id int NULL,
    project_id int NULL,
    subject VARCHAR(255),
    body TEXT,
    attachments VARCHAR(255),
    status ENUM('sent','failed','delivered') DEFAULT 'sent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE table developers(
    id int primary key auto_increment,
    name varchar(100),
    email varchar(100),
    password varchar(100),
    contacts varchar(50),
    foreign key (id) references users(id) on delete cascade
);

CREATE table system_logs(
    id int primary key auto_increment,
    level ENUM('info', 'warning', 'error') NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id int NULL,
    ip_address varchar(45) NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
