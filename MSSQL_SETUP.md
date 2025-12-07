# MSSQL Backend Setup Guide

Your CRM application has been migrated from Supabase to use MSSQL with a Node.js Express API backend.

## Prerequisites

1. **MSSQL Server** - Must be installed and running
   - Default port: 1433
   - Download from: https://www.microsoft.com/en-us/sql-server/sql-server-downloads

2. **Create Database**
   - Open SQL Server Management Studio (SSMS)
   - Create a new database named `CRM` (or update the database name in `.env`)

3. **Create Tables**
   - In SSMS, open a new query window
   - Copy all SQL from `src/server/schema.sql`
   - Execute it against the `CRM` database

## Environment Configuration

Update `.env` with your MSSQL connection details:

```
VITE_API_URL=http://localhost:3001

MSSQL_SERVER=localhost          # Your MSSQL server address
MSSQL_USER=sa                   # SQL Server username
MSSQL_PASSWORD=YourPassword123! # SQL Server password
MSSQL_DATABASE=CRM              # Database name
MSSQL_PORT=1433                 # MSSQL port
MSSQL_ENCRYPT=true              # Enable encryption
MSSQL_TRUST_SERVER_CERTIFICATE=true  # Trust self-signed certs (dev only)
```

## Running the Application

### Terminal 1 - Backend API Server

```bash
npm run server
```

This will:
1. Compile TypeScript to JavaScript
2. Start the Express server on port 3001
3. Log: `Server running on http://localhost:3001`

### Terminal 2 - Frontend Development Server

```bash
npm run dev
```

This will start the Vite dev server on port 5173.

## API Endpoints

The backend provides the following REST endpoints:

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Services
- `GET /api/services` - List all services
- `POST /api/services` - Create new service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### Quotations
- `GET /api/quotations` - List all quotations
- `POST /api/quotations` - Create quotation
- `PUT /api/quotations/:id` - Update quotation
- `DELETE /api/quotations/:id` - Delete quotation
- `GET /api/quotation-items/quotation/:quotationId` - Get quotation items
- `POST /api/quotation-items` - Create quotation item
- `DELETE /api/quotation-items/:id` - Delete quotation item

### Invoices
- `GET /api/invoices` - List all invoices
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `GET /api/invoice-items/invoice/:invoiceId` - Get invoice items
- `POST /api/invoice-items` - Create invoice item
- `DELETE /api/invoice-items/:id` - Delete invoice item

## Troubleshooting

### Connection Failed
- Verify MSSQL Server is running
- Check firewall settings allow port 1433
- Verify credentials in `.env`
- Ensure database exists

### Tables Not Found
- Run the schema.sql script from `src/server/schema.sql`
- Verify you're connected to the correct database

### Port Already in Use
- Change `PORT` in `.env` (default: 3001)
- Or kill existing process using port 3001

## File Structure

```
src/server/
├── index.ts      - Express server setup
├── db.ts         - MSSQL connection pool
├── routes.ts     - API route handlers
└── schema.sql    - Database schema

src/lib/
└── api.ts        - Frontend API client

src/components/
├── Customers.tsx      - Customer management
├── Services.tsx       - Service management
├── Quotations.tsx     - Quotation listing
├── QuotationForm.tsx  - Create/edit quotations
├── Invoices.tsx       - Invoice listing
└── InvoiceForm.tsx    - Create/edit invoices
```

## Building for Production

```bash
npm run build        # Build frontend
npm run server:build # Compile server TypeScript
node dist/server/index.js  # Run compiled server
```
