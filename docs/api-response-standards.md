# API Response Standards

## Success Responses

Use a consistent envelope:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "uuid"
  }
}
```

## Error Responses

Use a consistent error envelope:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request payload is invalid.",
    "details": []
  }
}
```

## Status Codes

- 200: Successful read or update
- 201: Resource created
- 204: Successful delete with no content
- 400: Client validation error
- 401: Authentication required
- 403: Forbidden
- 404: Resource not found
- 409: Conflict
- 422: Unprocessable entity
- 500: Internal server error
