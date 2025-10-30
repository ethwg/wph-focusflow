-- 1. Organization
CREATE TABLE organization (
    org_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(255) UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Team
CREATE TABLE team (
    team_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization(org_id),
    name VARCHAR(255) NOT NULL,
    invite_code VARCHAR(255) UNIQUE,
    members JSONB DEFAULT '{}'::jsonb,
    manager_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Role
CREATE TABLE role (
    role_id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(255),
    default_tools JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. User (renamed to user_account)
CREATE TABLE user_account (
    user_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization(org_id),
    team_id INT REFERENCES team(team_id),
    role_id INT REFERENCES role(role_id),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    timezone VARCHAR(255),
    privacy_settings JSONB DEFAULT '{}'::jsonb,
    tool_connections JSONB DEFAULT '{}'::jsonb,
    devices JSONB DEFAULT '{}'::jsonb,
    tracking_enabled BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 5. Tool
CREATE TABLE tool (
    tool_id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(255),
    integration_type VARCHAR(255),
    config JSONB DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT TRUE
);

-- 6. ActionTemplate
CREATE TABLE action_template (
    template_id SERIAL PRIMARY KEY,
    role_id INT NOT NULL REFERENCES role(role_id),
    tool_id INT NOT NULL REFERENCES tool(tool_id),
    action_type VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    default_minutes INT,
    weight INT,
    active BOOLEAN DEFAULT TRUE
);

-- 7. ActivityLog
CREATE TABLE activity_log (
    log_id BIGSERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES user_account(user_id),
    tool_id INT REFERENCES tool(tool_id),
    template_id INT REFERENCES action_template(template_id),
    event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    minutes INT,
    title VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. DailySummary
CREATE TABLE daily_summary (
    summary_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES user_account(user_id),
    summary_date DATE NOT NULL,
    ai_summary TEXT,
    total_actions INT,
    total_minutes INT,
    breakdown JSONB DEFAULT '{}'::jsonb,
    submitted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, summary_date)
);

-- 9. WeeklyReport
CREATE TABLE weekly_report (
    report_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES user_account(user_id),
    week_start DATE NOT NULL,
    total_actions INT,
    total_minutes INT,
    project_time JSONB DEFAULT '{}'::jsonb,
    daily_stats JSONB DEFAULT '{}'::jsonb,
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, week_start)
);

-- 10. TeamReport
CREATE TABLE team_report (
    team_report_id SERIAL PRIMARY KEY,
    team_id INT NOT NULL REFERENCES team(team_id),
    week_start DATE NOT NULL,
    ai_summary TEXT,
    team_stats JSONB DEFAULT '{}'::jsonb,
    member_reports JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, week_start)
);

-- 11. MeetingSummary
CREATE TABLE meeting_summary (
    meeting_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES user_account(user_id),
    tool_id INT REFERENCES tool(tool_id),
    meeting_date DATE,
    title VARCHAR(255),
    ai_summary TEXT,
    decisions JSONB DEFAULT '{}'::jsonb,
    action_items JSONB DEFAULT '{}'::jsonb,
    approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Notification
CREATE TABLE notification (
    notification_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES user_account(user_id),
    type VARCHAR(50),
    message TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
