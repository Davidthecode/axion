# API Documentation

Base URL: `http://localhost:5111`

All routes follow the Axion pattern: `POST|GET|PATCH|DELETE /api/:module/:method`

Authenticated routes require a `token` header (JWT returned on login).

---

## Auth

### POST /api/auth/login
```json
{ "email": "admin@school.com", "password": "password123" }
```
Returns `{ user, token }`.

### POST /api/auth/signupSuperAdmin
```json
{ "username": "david", "email": "d@co.com", "password": "pass1234", "adminKey": "your_admin_key" }
```
`adminKey` must match `SUPERADMIN_CREATION_KEY` in `.env`.

### POST /api/auth/createSchoolAdmin *(superadmin only)*
```json
{ "username": "jane", "email": "j@co.com", "password": "pass1234", "schoolId": "<id>" }
```

### GET /api/auth/getMyProfile *(any authenticated user)*
Returns the current user's profile (no password).

---

## Schools *(superadmin only)*

| Method | Endpoint | Body / Params |
|---|---|---|
| `POST` | `/api/schools/createSchool` | `{ name, address?, phone?, email? }` |
| `GET` | `/api/schools/getSchools` | — |
| `GET` | `/api/schools/getSchool` | `?schoolId=<id>` |
| `PATCH` | `/api/schools/updateSchool` | `{ schoolId, name?, address?, phone?, email? }` |
| `DELETE` | `/api/schools/deleteSchool` | `{ schoolId }` |

---

## Classrooms *(schooladmin only — scoped to their school)*

| Method | Endpoint | Body / Params |
|---|---|---|
| `POST` | `/api/classrooms/createClassroom` | `{ name, capacity?, resources? }` |
| `GET` | `/api/classrooms/getClassrooms` | — |
| `GET` | `/api/classrooms/getClassroom` | `?classroomId=<id>` |
| `PATCH` | `/api/classrooms/updateClassroom` | `{ classroomId, name?, capacity?, resources? }` |
| `DELETE` | `/api/classrooms/deleteClassroom` | `{ classroomId }` |

---

## Students *(schooladmin only — scoped to their school)*

| Method | Endpoint | Body / Params |
|---|---|---|
| `POST` | `/api/students/enrollStudent` | `{ name, age?, email?, classroomId? }` |
| `GET` | `/api/students/getStudents` | — |
| `GET` | `/api/students/getStudent` | `?studentId=<id>` |
| `PATCH` | `/api/students/updateStudent` | `{ studentId, name?, age?, email? }` |
| `DELETE` | `/api/students/deleteStudent` | `{ studentId }` |
| `POST` | `/api/students/transferStudent` | `{ studentId, newClassroomId }` |

`transferStudent` is atomic — it validates that the destination classroom belongs to the same school and has available capacity.

---

## Response Format

**Success**
```json
{ "ok": true, "data": { ... }, "errors": [], "message": "" }
```

**Error**
```json
{ "ok": false, "data": {}, "errors": "description", "message": "" }
```

## HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `400` | Validation error / bad request |
| `401` | Unauthenticated or unauthorized |
| `404` | Resource not found |
| `409` | Conflict (e.g. duplicate user) |
| `500` | Internal server error |
