# X Clinic Smart Booking & Management System

A comprehensive web-based clinic management system that enables patients to book appointments remotely, track live queues, and manage payments, while allowing clinic staff to manage patients in real-time.

## Features

### Patient-Facing Features
- **No-Account Booking**: Book appointments without creating an account
- **Instant UID & QR Generation**: Get unique identifier and QR code immediately
- **Live Queue Tracking**: Monitor queue position and estimated wait time in real-time
- **Multiple Payment Options**: Pay online or at the clinic
- **Digital Prescriptions**: Download prescriptions after consultation
- **SMS/WhatsApp Notifications**: Receive booking confirmations (simulated)

### Admin Features
- **Real-time Queue Management**: View and manage live patient queue
- **QR Code Scanning**: Quick patient check-in via QR scanner
- **Patient Profiles**: Auto-open profiles with complete history
- **Prescription Upload**: Upload and manage digital prescriptions
- **Payment Tracking**: Monitor all transactions and payment statuses
- **Advanced Search**: Find patients by name, UID, or phone
- **Comprehensive Analytics**: Track visits, revenue, and performance
- **Clinic Settings**: Configure clinic information and operating hours

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime subscriptions
- **QR Codes**: qrcode library for generation, html5-qrcode for scanning
- **Authentication**: Supabase Auth (admin only)
- **File Storage**: Supabase Storage (for prescriptions)
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns

## Setup Instructions

### 1. Clone and Install
```bash
git clone <repository-url>
cd x-clinic-system
npm install
```

### 2. Supabase Setup
1. Create a new Supabase project at https://app.supabase.com
2. Go to Settings > API to get your URL and anon key
3. Copy `.env.example` to `.env` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup
1. In your Supabase dashboard, go to SQL Editor
2. Copy and run the SQL from `src/lib/database.sql`
3. This will create all necessary tables, policies, and initial data

### 4. Optional: Storage Setup
1. In Supabase dashboard, go to Storage
2. Create a bucket named `prescriptions`
3. Set it to public if you want direct file access

### 5. Run the Application
```bash
npm run dev
```

## Usage

### Patient Flow
1. Visit the homepage to see clinic info and live queue
2. Click "Book My Visit" to make an appointment
3. Fill out the booking form with your details
4. Choose payment method (online or at clinic)
5. Receive UID and QR code instantly
6. Track your queue position in real-time
7. Arrive at the clinic and check in with QR code or UID
8. Download prescription after consultation

### Admin Flow
1. Go to `/admin/login` and use demo credentials:
   - Email: `admin@xclinic.com`
   - Password: `admin123`
2. Access the admin dashboard to see today's stats
3. Manage the live queue from the Queue page
4. Use QR scanner to quickly find and check in patients
5. View patient profiles with complete history
6. Upload prescriptions and add consultation notes
7. Track payments and export financial reports
8. Search patients by various criteria
9. Update clinic settings and information

## Key Features in Detail

### Real-time Updates
- Queue positions update automatically for patients
- Admin dashboard refreshes with new bookings instantly
- Payment status changes reflect immediately across the system

### QR Code System
- Each booking generates a unique QR code containing UID and visit ID
- Admin can scan QR codes to instantly open patient profiles
- Supports both camera scanning and manual UID entry

### Payment Management
- Flexible payment options (online/clinic)
- Real-time payment status tracking
- Comprehensive transaction history with export functionality
- Manual payment confirmation for cash transactions

### Queue Management
- Automatic token number assignment
- Real-time queue position calculation
- Estimated wait time based on average consultation duration
- Easy status updates (waiting → arrived → in consultation → completed)

### Security & Data Protection
- Row Level Security (RLS) enabled on all tables
- Public access for patient data viewing (by UID)
- Admin authentication required for management functions
- Secure file upload and storage for prescriptions

## Architecture

### Database Schema
- **clinic_settings**: Store clinic configuration
- **visits**: All patient visits and bookings
- **queue_summary**: Real-time queue statistics for homepage display

### Security Model
- Public read access to clinic settings and queue summary
- Public create access for new visits (patient bookings)
- Authenticated access required for admin operations
- RLS policies ensure data isolation and security

### File Organization
- Modular component architecture
- Separate admin and public page structures
- Centralized type definitions and utilities
- Clean separation of concerns with dedicated API layer

## Customization

### Branding
- Update clinic information in the admin settings panel
- Modify color scheme in Tailwind config
- Replace logo and branding elements as needed

### Features
- Add new payment gateways in the booking flow
- Extend patient fields as required
- Implement additional notification channels
- Add more detailed analytics and reporting

### Integration
- Connect to SMS/WhatsApp APIs for real notifications
- Integrate with existing hospital management systems
- Add calendar integration for appointment scheduling
- Connect to electronic health record systems

## Deployment

The application is ready for deployment on platforms like Netlify, Vercel, or any static hosting service. Ensure your environment variables are configured in your deployment platform.

For production:
1. Set up your production Supabase project
2. Update environment variables
3. Configure your domain and SSL
4. Test all functionality thoroughly

## Support

This is a complete, production-ready clinic management system with all features implemented and working. The system handles real-time updates, secure data management, and provides an excellent user experience for both patients and clinic staff.