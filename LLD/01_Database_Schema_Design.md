# Low-Level Design: Database Schema Design

## 1. Database Technology
- **Primary DB**: PostgreSQL 14+
- **ORM**: Prisma (recommended) or TypeORM
- **Caching**: Redis
- **Migrations**: Automated via ORM

---

## 2. Schema Design

### 2.1 Users Table
Stores parent/admin accounts

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('PARENT', 'ADMIN', 'SCHOOL_ADMIN')),
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
```

### 2.2 Refresh Tokens Table
For JWT refresh token management

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_revoked BOOLEAN DEFAULT false
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
```

### 2.3 Students Table
Children/beneficiaries of parents

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  grade VARCHAR(50),
  school_id UUID REFERENCES schools(id),
  allergies TEXT,
  dietary_preferences TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_students_parent_id ON students(parent_id);
CREATE INDEX idx_students_school_id ON students(school_id);
```

### 2.4 Schools Table
Educational institutions

```sql
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  is_service_available BOOLEAN DEFAULT true,
  delivery_instructions TEXT,
  operating_days VARCHAR(50) DEFAULT 'MON,TUE,WED,THU,FRI',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_schools_code ON schools(code);
CREATE INDEX idx_schools_city ON schools(city);
```

### 2.5 Meal Plans Table
Subscription packages offered by schools

```sql
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('BREAKFAST', 'LUNCH', 'SNACK', 'COMBO')),
  duration_days INTEGER NOT NULL,
  price_per_day DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_meal_plans_school_id ON meal_plans(school_id);
CREATE INDEX idx_meal_plans_is_active ON meal_plans(is_active);
```

### 2.6 Menu Items Table
Daily/weekly menu details

```sql
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  day_of_week VARCHAR(20) CHECK (day_of_week IN ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')),
  day_number INTEGER,
  items TEXT NOT NULL,
  description TEXT,
  calories INTEGER,
  allergen_info TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_menu_items_meal_plan_id ON menu_items(meal_plan_id);
```

### 2.7 Subscriptions Table
Core subscription management

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_number VARCHAR(50) UNIQUE NOT NULL,
  parent_id UUID NOT NULL REFERENCES users(id),
  student_id UUID NOT NULL REFERENCES students(id),
  school_id UUID NOT NULL REFERENCES schools(id),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id),
  
  start_date DATE NOT NULL,
  original_end_date DATE NOT NULL,
  current_end_date DATE NOT NULL,
  
  total_days INTEGER NOT NULL,
  delivered_days INTEGER DEFAULT 0,
  paused_days INTEGER DEFAULT 0,
  remaining_days INTEGER NOT NULL,
  
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  
  status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED')),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  activated_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_subscriptions_parent_id ON subscriptions(parent_id);
CREATE INDEX idx_subscriptions_student_id ON subscriptions(student_id);
CREATE INDEX idx_subscriptions_school_id ON subscriptions(school_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_dates ON subscriptions(start_date, current_end_date);
```

### 2.8 Subscription Days Table
Pre-generated delivery schedule

```sql
CREATE TABLE subscription_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('SCHEDULED', 'DELIVERED', 'PAUSED', 'CANCELLED', 'SKIPPED')),
  delivery_confirmed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(subscription_id, scheduled_date)
);

CREATE INDEX idx_subscription_days_subscription_id ON subscription_days(subscription_id);
CREATE INDEX idx_subscription_days_date ON subscription_days(scheduled_date);
CREATE INDEX idx_subscription_days_status ON subscription_days(status);
```

### 2.9 Pause Requests Table
User-initiated pause management

```sql
CREATE TABLE pause_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES users(id),
  
  pause_from_date DATE NOT NULL,
  pause_to_date DATE NOT NULL,
  pause_days INTEGER NOT NULL,
  
  reason TEXT,
  status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSED')),
  
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  processed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pause_requests_subscription_id ON pause_requests(subscription_id);
CREATE INDEX idx_pause_requests_status ON pause_requests(status);
```

### 2.10 Orders Table
Financial transaction records

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  parent_id UUID NOT NULL REFERENCES users(id),
  
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL,
  
  payment_status VARCHAR(50) NOT NULL CHECK (payment_status IN ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED')),
  payment_method VARCHAR(50),
  payment_gateway_order_id VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_subscription_id ON orders(subscription_id);
CREATE INDEX idx_orders_parent_id ON orders(parent_id);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
```

### 2.11 Payment Transactions Table
Detailed payment tracking

```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  payment_gateway VARCHAR(50) NOT NULL,
  gateway_transaction_id VARCHAR(255),
  
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  
  status VARCHAR(50) NOT NULL CHECK (status IN ('INITIATED', 'SUCCESS', 'FAILED', 'REFUNDED')),
  
  gateway_response JSONB,
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
```

### 2.12 Notifications Table
User notification history

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  
  reference_id UUID,
  reference_type VARCHAR(50),
  
  is_read BOOLEAN DEFAULT false,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

### 2.13 CMS Pages Table
Static content management

```sql
CREATE TABLE cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cms_pages_slug ON cms_pages(slug);
```

### 2.14 Audit Logs Table
Admin action tracking

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## 3. Key Database Constraints

### 3.1 Business Rules Enforced at DB Level

1. **Subscription Days Uniqueness**: One subscription cannot have duplicate dates
2. **Date Consistency**: `current_end_date >= original_end_date`
3. **Status Transitions**: Handled via application logic + triggers
4. **Referential Integrity**: All foreign keys with appropriate cascade rules

### 3.2 Database Triggers

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- (Repeat for other tables)
```

---

## 4. Data Relationships

```
users (PARENT)
  ↓ 1:N
students
  ↓ N:1
schools
  ↓ 1:N
meal_plans
  ↓ 1:N
menu_items

subscriptions (Links: parent, student, school, meal_plan)
  ↓ 1:N
subscription_days
  ↓ 1:1
orders
  ↓ 1:N
payment_transactions

subscriptions
  ↓ 1:N
pause_requests
```

---

## 5. Indexing Strategy

- **Primary Keys**: All UUIDs indexed by default
- **Foreign Keys**: Explicitly indexed for join performance
- **Query Patterns**: Indexes on status, dates, and commonly filtered fields
- **Composite Indexes**: Consider for complex queries (e.g., school_id + date range)

---

## 6. Data Archival Strategy

- **Completed Subscriptions**: Archive after 1 year to `subscriptions_archive`
- **Old Notifications**: Purge after 90 days
- **Audit Logs**: Retain for 2 years, then move to cold storage

---

## 7. Backup & Disaster Recovery

- **Daily automated backups** with 30-day retention
- **Point-in-time recovery** enabled
- **Read replicas** for reporting queries (future)

---

## 8. Performance Considerations

- Connection pooling (min: 10, max: 50)
- Prepared statements for all queries
- Redis caching for:
  - School list
  - Meal plans
  - CMS pages
  - Active subscriptions (TTL: 5 min)

---

## 9. Prisma Schema Reference

See `schema.prisma` in backend project for complete ORM model definitions.
