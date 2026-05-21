# Google Login Setup

This project supports Google login by sending a Google ID token from the React app to the Spring Boot API.
The backend verifies the token against `GOOGLE_CLIENT_ID`, then returns the same JWT response shape as normal email/password login.

## 1. Create Google OAuth Client

1. Open Google Cloud Console.
2. Create or choose a project.
3. Configure OAuth consent screen.
4. Create an OAuth 2.0 Client ID with application type `Web application`.
5. Add authorized JavaScript origins:
   - `http://localhost:5173`
   - production frontend origin when deployed

## 2. Backend Env

Set this before running the backend:

```bash
export GOOGLE_CLIENT_ID="your-google-web-client-id.apps.googleusercontent.com"
```

Then run:

```bash
cd backend
./mvnw spring-boot:run
```

The backend reads it from:

```yaml
app:
  google:
    client-id: ${GOOGLE_CLIENT_ID:}
```

If this value is empty, `POST /api/auth/google` will reject login with a configuration error.

## 3. Frontend Env

Create or update `frontend/.env`:

```bash
VITE_API_BASE_URL=http://localhost:8080/api
VITE_GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

Then run:

```bash
cd frontend
npm run dev
```

If `VITE_GOOGLE_CLIENT_ID` is empty, the Google button is hidden from the login page.

## 4. Expected Flow

1. User clicks Google sign-in on `/login`.
2. Google Identity Services returns an ID token to the frontend.
3. Frontend sends:

```http
POST /api/auth/google
Content-Type: application/json

{
  "idToken": "google-id-token"
}
```

4. Backend verifies the token and checks that Google says the email is verified.
5. If the user email exists, the account is linked to Google.
6. If the user email does not exist, the backend creates a new `PATIENT` user and patient profile.
7. Backend returns `accessToken`, `refreshToken`, and the user summary.

## 5. Notes

- Google users have `auth_provider = GOOGLE` and `provider_id = Google subject`.
- A Google account cannot take over an email unless Google marks the email as verified.
- New Google users are created with role `PATIENT`.
- Local password login still works for existing local users.
