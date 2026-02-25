# Database Schema

## Collections

### users
| Field | Type | Notes |
|---|---|---|
| `username` | String | Unique, required |
| `email` | String | Unique, required |
| `password` | String | Bcrypt hashed |
| `role` | String | `superadmin` or `schooladmin` |
| `schoolId` | ObjectId → `schools` | Null for superadmins |

### schools
| Field | Type | Notes |
|---|---|---|
| `name` | String | Required |
| `address` | String | |
| `phone` | String | |
| `email` | String | |

### classrooms
| Field | Type | Notes |
|---|---|---|
| `name` | String | Required |
| `capacity` | Number | Max students allowed |
| `resources` | [String] | e.g. `['Projector', 'Whiteboard']` |
| `schoolId` | ObjectId → `schools` | Required |

### students
| Field | Type | Notes |
|---|---|---|
| `name` | String | Required |
| `age` | Number | |
| `email` | String | |
| `schoolId` | ObjectId → `schools` | Required |
| `classroomId` | ObjectId → `classrooms` | Optional |

## Relationships

```
School ──< Classroom ──< Student
School ──< User (schooladmin)
```

- Every classroom and student carries a `schoolId` — this is the tenancy key.
- School admins can only query data where `schoolId` matches their own.
- A student's `classroomId` must always reference a classroom within the same school.
