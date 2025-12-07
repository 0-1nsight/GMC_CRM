/*
  # CRM System Database Schema

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `name` (text, customer name)
      - `email` (text, customer email)
      - `phone` (text, phone number)
      - `company` (text, company name)
      - `address` (text, full address)
      - `created_at` (timestamptz, record creation time)
      - `updated_at` (timestamptz, last update time)

    - `services`
      - `id` (uuid, primary key)
      - `name` (text, service name)
      - `description` (text, service description)
      - `unit_price` (numeric, price per unit)
      - `unit` (text, unit of measurement - hours, items, etc.)
      - `created_at` (timestamptz, record creation time)
      - `updated_at` (timestamptz, last update time)

    - `quotations`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key to customers)
      - `quotation_number` (text, unique quotation identifier)
      - `date` (date, quotation date)
      - `valid_until` (date, expiration date)
      - `status` (text, draft/sent/accepted/rejected)
      - `notes` (text, additional notes)
      - `total` (numeric, total amount)
      - `created_at` (timestamptz, record creation time)
      - `updated_at` (timestamptz, last update time)

    - `quotation_items`
      - `id` (uuid, primary key)
      - `quotation_id` (uuid, foreign key to quotations)
      - `service_id` (uuid, foreign key to services)
      - `description` (text, item description)
      - `quantity` (numeric, quantity)
      - `unit_price` (numeric, price per unit)
      - `total` (numeric, line total)

    - `invoices`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key to customers)
      - `quotation_id` (uuid, optional foreign key to quotations)
      - `invoice_number` (text, unique invoice identifier)
      - `date` (date, invoice date)
      - `due_date` (date, payment due date)
      - `status` (text, draft/sent/paid/overdue)
      - `notes` (text, additional notes)
      - `total` (numeric, total amount)
      - `created_at` (timestamptz, record creation time)
      - `updated_at` (timestamptz, last update time)

    - `invoice_items`
      - `id` (uuid, primary key)
      - `invoice_id` (uuid, foreign key to invoices)
      - `service_id` (uuid, foreign key to services)
      - `description` (text, item description)
      - `quantity` (numeric, quantity)
      - `unit_price` (numeric, price per unit)
      - `total` (numeric, line total)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage all records
    - All tables are locked down by default and require authentication

  3. Important Notes
    - All monetary values use numeric type for precision
    - Quotations and invoices have auto-generated numbers
    - Items are stored in separate tables for flexibility
    - Foreign keys ensure referential integrity
    - Timestamps track creation and modification times
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  company text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  unit_price numeric(10, 2) NOT NULL DEFAULT 0,
  unit text DEFAULT 'unit',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create quotations table
CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  quotation_number text UNIQUE NOT NULL,
  date date DEFAULT CURRENT_DATE,
  valid_until date,
  status text DEFAULT 'draft',
  notes text,
  total numeric(10, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create quotation_items table
CREATE TABLE IF NOT EXISTS quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric(10, 2) NOT NULL DEFAULT 1,
  unit_price numeric(10, 2) NOT NULL DEFAULT 0,
  total numeric(10, 2) NOT NULL DEFAULT 0
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  quotation_id uuid REFERENCES quotations(id) ON DELETE SET NULL,
  invoice_number text UNIQUE NOT NULL,
  date date DEFAULT CURRENT_DATE,
  due_date date,
  status text DEFAULT 'draft',
  notes text,
  total numeric(10, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric(10, 2) NOT NULL DEFAULT 1,
  unit_price numeric(10, 2) NOT NULL DEFAULT 0,
  total numeric(10, 2) NOT NULL DEFAULT 0
);

-- Create indexes for foreign keys and common queries
CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customers
CREATE POLICY "Authenticated users can view all customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete customers"
  ON customers FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for services
CREATE POLICY "Authenticated users can view all services"
  ON services FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create services"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update services"
  ON services FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete services"
  ON services FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for quotations
CREATE POLICY "Authenticated users can view all quotations"
  ON quotations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create quotations"
  ON quotations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update quotations"
  ON quotations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete quotations"
  ON quotations FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for quotation_items
CREATE POLICY "Authenticated users can view all quotation items"
  ON quotation_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create quotation items"
  ON quotation_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update quotation items"
  ON quotation_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete quotation items"
  ON quotation_items FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for invoices
CREATE POLICY "Authenticated users can view all invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for invoice_items
CREATE POLICY "Authenticated users can view all invoice items"
  ON invoice_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create invoice items"
  ON invoice_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update invoice items"
  ON invoice_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete invoice items"
  ON invoice_items FOR DELETE
  TO authenticated
  USING (true);