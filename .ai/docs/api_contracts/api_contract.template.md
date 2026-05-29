# 📝 API Contract Template

**Endpoint / Action:** `GET /api/example`  
**Description:** Fetches user details.  
**Last Verified:** `YYYY-MM-DD`

## 📥 Request
**Method:** `GET`  
**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```
**Payload / Query:**
```typescript
interface RequestPayload {
  userId: string;
}
```

## 📤 Expected Response
**Status:** `200 OK`  
**Response Body:**
```typescript
interface ResponsePayload {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}
```

## ❌ Error Responses
- `401 Unauthorized`: Invalid or missing token.
- `404 Not Found`: User does not exist.

---
*AI Rule: Always confirm this contract against the actual API behavior before integrating the code.*
