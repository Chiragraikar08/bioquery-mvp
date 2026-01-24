# Admin Setup Guide for BioQuery

## Quick Admin Setup

### Automatic Admin Creation (Recommended)

Run this command from the backend directory to create the default admin user:

\`\`\`bash
node scripts/create-admin.js
\`\`\`

This will create:
- **Email**: bioquery@gmail.com
- **Password**: BioQuery@123
- **Role**: admin

### Manual Admin Creation via API

1. Make sure the backend is running
2. Send a POST request to `/api/auth/create-admin`:

\`\`\`bash
curl -X POST http://localhost:5000/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bioquery@gmail.com",
    "password": "BioQuery@123",
    "phone": "N/A"
  }'
\`\`\`

3. Use the returned token for authentication

## Troubleshooting

### MongoDB Connection Issues

If you get a connection error:

1. Check if MongoDB is running locally or verify your `MONGODB_URI` in `.env`
2. Ensure all required environment variables are set:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `SMTP_EMAIL` and `SMTP_PASSWORD` (for OTP emails)

### Admin Already Exists

If the admin user already exists, you can:
1. Sign in directly with: bioquery@gmail.com / BioQuery@123
2. Or reset the password using the "Forgot Password" flow

## Environment Variables Required

\`\`\`env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bioquery
JWT_SECRET=your_jwt_secret_key_here
FRONTEND_URL=http://localhost:5173
PORT=5000
