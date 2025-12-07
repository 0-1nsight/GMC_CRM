import express from 'express';
import sql from 'mssql';
import { getPool } from './db.js';

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT 1 as connected');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  created_at: Date;
  updated_at: Date;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  unit_price: number;
  unit: string;
  created_at: Date;
  updated_at: Date;
}

interface Quotation {
  id: string;
  customer_id: string;
  quotation_number: string;
  date: string;
  valid_until: string | null;
  status: string;
  notes: string | null;
  total: number;
  created_at: Date;
  updated_at: Date;
}

interface QuotationItem {
  id: string;
  quotation_id: string;
  service_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Invoice {
  id: string;
  customer_id: string;
  quotation_id: string | null;
  invoice_number: string;
  date: string;
  due_date: string | null;
  status: string;
  notes: string | null;
  total: number;
  created_at: Date;
  updated_at: Date;
}

interface InvoiceItem {
  id: string;
  invoice_id: string;
  service_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

router.get('/customers', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT * FROM customers ORDER BY created_at DESC');
    res.json(result.recordset as Customer[]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

router.post('/customers', async (req, res) => {
  try {
    const { name, email, phone, company, address } = req.body;
    const pool = getPool();
    const id = new sql.UniqueIdentifier().toString();

    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email || null)
      .input('phone', sql.NVarChar, phone || null)
      .input('company', sql.NVarChar, company || null)
      .input('address', sql.NVarChar, address || null)
      .query('INSERT INTO customers (id, name, email, phone, company, address) VALUES (@id, @name, @email, @phone, @company, @address)');

    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

router.put('/customers/:id', async (req, res) => {
  try {
    const { name, email, phone, company, address } = req.body;
    const pool = getPool();

    await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email || null)
      .input('phone', sql.NVarChar, phone || null)
      .input('company', sql.NVarChar, company || null)
      .input('address', sql.NVarChar, address || null)
      .query('UPDATE customers SET name = @name, email = @email, phone = @phone, company = @company, address = @address, updated_at = GETUTCDATE() WHERE id = @id');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

router.delete('/customers/:id', async (req, res) => {
  try {
    const pool = getPool();
    await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query('DELETE FROM customers WHERE id = @id');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

router.get('/services', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT * FROM services ORDER BY created_at DESC');
    res.json(result.recordset as Service[]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

router.post('/services', async (req, res) => {
  try {
    const { name, description, unit_price, unit } = req.body;
    const pool = getPool();
    const id = new sql.UniqueIdentifier().toString();

    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description || null)
      .input('unit_price', sql.Decimal(10, 2), unit_price || 0)
      .input('unit', sql.NVarChar, unit || 'unit')
      .query('INSERT INTO services (id, name, description, unit_price, unit) VALUES (@id, @name, @description, @unit_price, @unit)');

    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

router.put('/services/:id', async (req, res) => {
  try {
    const { name, description, unit_price, unit } = req.body;
    const pool = getPool();

    await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description || null)
      .input('unit_price', sql.Decimal(10, 2), unit_price || 0)
      .input('unit', sql.NVarChar, unit || 'unit')
      .query('UPDATE services SET name = @name, description = @description, unit_price = @unit_price, unit = @unit, updated_at = GETUTCDATE() WHERE id = @id');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

router.delete('/services/:id', async (req, res) => {
  try {
    const pool = getPool();
    await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query('DELETE FROM services WHERE id = @id');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

router.get('/quotations', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT * FROM quotations ORDER BY created_at DESC');
    res.json(result.recordset as Quotation[]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

router.post('/quotations', async (req, res) => {
  try {
    const { customer_id, quotation_number, date, valid_until, status, notes, total } = req.body;
    const pool = getPool();
    const id = new sql.UniqueIdentifier().toString();

    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('customer_id', sql.UniqueIdentifier, customer_id)
      .input('quotation_number', sql.NVarChar, quotation_number)
      .input('date', sql.Date, date || new Date())
      .input('valid_until', sql.Date, valid_until || null)
      .input('status', sql.NVarChar, status || 'draft')
      .input('notes', sql.NVarChar, notes || null)
      .input('total', sql.Decimal(10, 2), total || 0)
      .query('INSERT INTO quotations (id, customer_id, quotation_number, date, valid_until, status, notes, total) VALUES (@id, @customer_id, @quotation_number, @date, @valid_until, @status, @notes, @total)');

    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

router.put('/quotations/:id', async (req, res) => {
  try {
    const { customer_id, quotation_number, date, valid_until, status, notes, total } = req.body;
    const pool = getPool();

    await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .input('customer_id', sql.UniqueIdentifier, customer_id)
      .input('quotation_number', sql.NVarChar, quotation_number)
      .input('date', sql.Date, date)
      .input('valid_until', sql.Date, valid_until || null)
      .input('status', sql.NVarChar, status)
      .input('notes', sql.NVarChar, notes || null)
      .input('total', sql.Decimal(10, 2), total || 0)
      .query('UPDATE quotations SET customer_id = @customer_id, quotation_number = @quotation_number, date = @date, valid_until = @valid_until, status = @status, notes = @notes, total = @total, updated_at = GETUTCDATE() WHERE id = @id');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

router.delete('/quotations/:id', async (req, res) => {
  try {
    const pool = getPool();
    await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query('DELETE FROM quotations WHERE id = @id');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

router.get('/quotation-items/quotation/:quotationId', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('quotation_id', sql.UniqueIdentifier, req.params.quotationId)
      .query('SELECT * FROM quotation_items WHERE quotation_id = @quotation_id');
    res.json(result.recordset as QuotationItem[]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

router.post('/quotation-items', async (req, res) => {
  try {
    const { quotation_id, service_id, description, quantity, unit_price, total } = req.body;
    const pool = getPool();
    const id = new sql.UniqueIdentifier().toString();

    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('quotation_id', sql.UniqueIdentifier, quotation_id)
      .input('service_id', sql.UniqueIdentifier, service_id || null)
      .input('description', sql.NVarChar, description)
      .input('quantity', sql.Decimal(10, 2), quantity)
      .input('unit_price', sql.Decimal(10, 2), unit_price)
      .input('total', sql.Decimal(10, 2), total)
      .query('INSERT INTO quotation_items (id, quotation_id, service_id, description, quantity, unit_price, total) VALUES (@id, @quotation_id, @service_id, @description, @quantity, @unit_price, @total)');

    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

router.delete('/quotation-items/:id', async (req, res) => {
  try {
    const pool = getPool();
    await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query('DELETE FROM quotation_items WHERE id = @id');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

router.get('/invoices', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT * FROM invoices ORDER BY created_at DESC');
    res.json(result.recordset as Invoice[]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

router.post('/invoices', async (req, res) => {
  try {
    const { customer_id, quotation_id, invoice_number, date, due_date, status, notes, total } = req.body;
    const pool = getPool();
    const id = new sql.UniqueIdentifier().toString();

    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('customer_id', sql.UniqueIdentifier, customer_id)
      .input('quotation_id', sql.UniqueIdentifier, quotation_id || null)
      .input('invoice_number', sql.NVarChar, invoice_number)
      .input('date', sql.Date, date || new Date())
      .input('due_date', sql.Date, due_date || null)
      .input('status', sql.NVarChar, status || 'draft')
      .input('notes', sql.NVarChar, notes || null)
      .input('total', sql.Decimal(10, 2), total || 0)
      .query('INSERT INTO invoices (id, customer_id, quotation_id, invoice_number, date, due_date, status, notes, total) VALUES (@id, @customer_id, @quotation_id, @invoice_number, @date, @due_date, @status, @notes, @total)');

    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

router.put('/invoices/:id', async (req, res) => {
  try {
    const { customer_id, quotation_id, invoice_number, date, due_date, status, notes, total } = req.body;
    const pool = getPool();

    await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .input('customer_id', sql.UniqueIdentifier, customer_id)
      .input('quotation_id', sql.UniqueIdentifier, quotation_id || null)
      .input('invoice_number', sql.NVarChar, invoice_number)
      .input('date', sql.Date, date)
      .input('due_date', sql.Date, due_date || null)
      .input('status', sql.NVarChar, status)
      .input('notes', sql.NVarChar, notes || null)
      .input('total', sql.Decimal(10, 2), total || 0)
      .query('UPDATE invoices SET customer_id = @customer_id, quotation_id = @quotation_id, invoice_number = @invoice_number, date = @date, due_date = @due_date, status = @status, notes = @notes, total = @total, updated_at = GETUTCDATE() WHERE id = @id');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

router.delete('/invoices/:id', async (req, res) => {
  try {
    const pool = getPool();
    await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query('DELETE FROM invoices WHERE id = @id');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

router.get('/invoice-items/invoice/:invoiceId', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('invoice_id', sql.UniqueIdentifier, req.params.invoiceId)
      .query('SELECT * FROM invoice_items WHERE invoice_id = @invoice_id');
    res.json(result.recordset as InvoiceItem[]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

router.post('/invoice-items', async (req, res) => {
  try {
    const { invoice_id, service_id, description, quantity, unit_price, total } = req.body;
    const pool = getPool();
    const id = new sql.UniqueIdentifier().toString();

    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('invoice_id', sql.UniqueIdentifier, invoice_id)
      .input('service_id', sql.UniqueIdentifier, service_id || null)
      .input('description', sql.NVarChar, description)
      .input('quantity', sql.Decimal(10, 2), quantity)
      .input('unit_price', sql.Decimal(10, 2), unit_price)
      .input('total', sql.Decimal(10, 2), total)
      .query('INSERT INTO invoice_items (id, invoice_id, service_id, description, quantity, unit_price, total) VALUES (@id, @invoice_id, @service_id, @description, @quantity, @unit_price, @total)');

    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

router.delete('/invoice-items/:id', async (req, res) => {
  try {
    const pool = getPool();
    await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query('DELETE FROM invoice_items WHERE id = @id');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

export default router;
