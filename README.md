# School Management System API

Built on the [Axion](https://github.com/qantra-io/axion) template. This API manages schools, classrooms, and students with strictly enforced multi-tenancy.

**Live URL**: [https://axion-p658.onrender.com](https://axion-p658.onrender.com)

## Setup

**Prerequisites**: Node.js, MongoDB, Redis (required by the Axion core).

1. **Install**:
   ```bash
   npm install
   ```
2. **Configure**:
   Create a `.env` file with the following:
   ```env
   MONGO_URI=mongodb://localhost:27017/axion_school
   LONG_TOKEN_SECRET=your_long_secret
   SHORT_TOKEN_SECRET=your_short_secret
   NACL_SECRET=your_nacl_secret_32_chars
   SUPERADMIN_CREATION_KEY=your_secret_admin_key
   ```
3. **Run**:
   ```bash
   node index.js
   ```

## Testing

### Automated
```bash
npm test
```

### Manual (Postman/cURL)
1. **Create SuperAdmin**: `POST /api/auth/signupSuperAdmin` with `adminKey`.
2. **Login**: `POST /api/auth/login`. Use the returned `token` in headers for subsequent requests.
3. **Create School**: `POST /api/schools/createSchool` (SuperAdmin token).
4. **Create SchoolAdmin**: `POST /api/auth/createSchoolAdmin` (SuperAdmin token).

Detailed endpoint specs are in [API Documentation](./API_DOCS.md).

## Design
- **Tenancy**: A `schooladmin` is hard-scoped to their `schoolId`. They cannot see or modify data from other schools.
- **Transactions**: Student transfers use MongoDB sessions to ensure atomicity and verify capacity mid-flight.
- **Security**: Includes Helmet for headers and rate limiting on all `/api` routes.

## Deliverables
- [API Documentation](./API_DOCS.md)
- [Database Schema](./DATABASE_SCHEMA.md)

