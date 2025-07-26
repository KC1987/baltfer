# Database Setup Instructions

Follow these steps to set up your Supabase database for the Baltfer transfer booking application.

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key to your `.env.local` file

## Setup Steps

### 1. Create Tables
Run the SQL commands in the following order in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of schema.sql
```

This will create all the necessary tables with proper relationships and constraints.

### 2. Add Admin Role Support
```sql
-- Copy and paste the contents of add-admin-role.sql
```

This adds role-based access control and automatic profile creation.

### 3. Enable Row Level Security
```sql
-- Copy and paste the contents of rls-policies.sql
```

This secures your database with proper access controls.

### 4. Add Notes Column (Latest Migration)
```sql
-- Copy and paste the contents of add-notes-column.sql
```

This adds support for customer notes in the booking process.

### 5. Set Up Your Admin Account

1. Sign up for an account in your app
2. Go to Supabase Dashboard → Authentication → Users
3. Copy your user UUID
4. Run this SQL query to make yourself an admin:

```sql
UPDATE profiles SET role = 'admin' WHERE id = 'your-user-uuid-here';
```

## Database Schema Overview

### Core Tables

- **profiles** - User profile information with roles
- **locations** - Popular pickup/destination locations
- **vehicle_types** - Available vehicle categories with pricing
- **bookings** - Customer transfer bookings with notes
- **drivers** - Driver profiles and vehicle information
- **driver_assignments** - Links drivers to specific bookings
- **pricing_rules** - Dynamic pricing configuration
- **reviews** - Customer reviews and ratings

### Key Features

- **Automatic Profile Creation** - Profiles are created automatically when users sign up
- **Role-Based Access** - Support for customer, driver, and admin roles
- **Row Level Security** - Secure data access based on user permissions
- **Audit Trail** - Timestamps and update tracking
- **Data Integrity** - Foreign key constraints and check constraints

## Sample Data

The schema includes sample data for:
- 5 vehicle types (Economy to Executive)
- 5 popular locations (airports and stations)
- 5 pricing rules (peak hours, night surcharge, etc.)

## Testing the Setup

After running all scripts, you should be able to:

1. Sign up for a new account
2. See your profile created automatically
3. View available vehicle types and locations
4. Access the dashboard (if authenticated)

## Troubleshooting

### Common Issues

1. **Foreign Key Errors**: Make sure to run schema.sql first
2. **RLS Policy Errors**: Ensure all tables exist before applying policies
3. **Permission Denied**: Check that RLS policies are correctly applied
4. **Missing Profile**: Verify the trigger function is working

### Verify Setup

Run these queries to verify your setup:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check sample data
SELECT * FROM vehicle_types;
SELECT * FROM locations;
SELECT * FROM pricing_rules;
```

## Next Steps

After database setup:

1. Update your TypeScript types in `lib/supabase.ts`
2. Copy your environment variables to `.env.local`
3. Test authentication flow
4. Start implementing the booking system

## Security Notes

- Never commit your actual Supabase keys to version control
- Use environment variables for all sensitive configuration
- Regularly review and update RLS policies
- Monitor database usage and performance
- Set up proper backup procedures for production