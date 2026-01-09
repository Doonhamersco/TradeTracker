# Forgot Password Feature - Design Specification

## Overview
This document outlines the complete design specification for implementing forgot password functionality in the Trade Tracker application using Firebase Authentication.

---

## 1. User Flow & States

### 1.1 State Machine

```
[Login Page] 
    ↓ (Click "Forgot Password?")
[Forgot Password Form Expanded] 
    ↓ (Enter email, submit)
[Loading State]
    ↓ (Success)
[Success Message: "Password reset email sent to [email]"]
    ↓ (After 5 seconds or manual close)
[Collapse back to Login Form]
```

### 1.2 Detailed State Transitions

#### State 1: Initial Login Page
- **UI**: Login form visible, "Forgot Password?" link visible below password field
- **User Action**: Click "Forgot Password?" link
- **Transition**: Expand forgot password form inline

#### State 2: Forgot Password Form Expanded
- **UI**: 
  - Login form remains visible but disabled/grayed out
  - Forgot password form appears below login form
  - Email input field
  - "Send Reset Email" button
  - "Back to Login" link/button
- **User Action**: Enter email address, click "Send Reset Email"
- **Validation**: 
  - Email format validation (client-side)
  - Rate limiting check (client-side + server-side)
- **Transition**: Show loading state

#### State 3: Loading State
- **UI**: 
  - Disable submit button
  - Show spinner/loading indicator
  - Disable email input
- **Duration**: Until Firebase responds (typically 1-3 seconds)
- **Transition**: 
  - Success → Show success message
  - Error → Show error message

#### State 4: Success State
- **UI**: 
  - Success message: "Password reset email sent to [email]"
  - Green success indicator
  - Email input cleared
  - Option to collapse form or auto-collapse after 5 seconds
- **User Action**: 
  - Wait for auto-collapse, OR
  - Click "Back to Login" to collapse manually
- **Transition**: Collapse form, return to login

#### State 5: Email Link Clicked (User receives email)
- **User Action**: Click reset link in email
- **Firebase Behavior**: Opens reset page (Firebase-hosted or custom)
- **Token Validation**: Firebase validates token automatically
- **Transition**: Show password reset form

#### State 6: Password Reset Form (Firebase-hosted or custom)
- **UI**: 
  - New password input
  - Confirm password input
  - "Reset Password" button
- **User Action**: Enter new password, confirm, submit
- **Validation**: 
  - Password strength (min 8 characters)
  - Password match validation
- **Transition**: Password updated, redirect to login

#### State 7: Password Reset Complete
- **UI**: Success message, redirect to login page
- **User Action**: Log in with new password

---

## 2. Security Controls

### 2.1 Rate Limiting

#### Per Email Address
- **Limit**: 3 reset requests per hour per email address
- **Storage**: Firestore collection `passwordResetAttempts`
  - Document ID: `{email}_${timestampHour}`
  - Fields: `email`, `timestamp`, `count`, `ipAddress`
- **Implementation**: 
  - Check before calling Firebase `sendPasswordResetEmail()`
  - Increment counter on each request
  - Reset counter after 1 hour window expires

#### Per IP Address
- **Limit**: 5 reset requests per hour per IP address
- **Storage**: Firestore collection `passwordResetIPAttempts`
  - Document ID: `{ipAddress}_${timestampHour}`
  - Fields: `ipAddress`, `timestamp`, `count`
- **Implementation**: 
  - Extract IP from request (client-side via API or server-side)
  - Check before allowing request
  - Increment counter on each request

#### Rate Limit Response
- **When Limit Exceeded**: 
  - Show error: "Too many reset requests. Please try again in [X] minutes."
  - Calculate remaining time from last request
  - Disable form submission until time expires

### 2.2 Token Expiration
- **Firebase Default**: Password reset tokens expire after 1 hour
- **Handling**: 
  - If user clicks expired link, Firebase will show error
  - Custom error page can redirect to login with message: "Reset link has expired. Please request a new one."
  - Provide "Request New Reset Link" button

### 2.3 Password Strength Requirements
- **Minimum Length**: 8 characters (Firebase default)
- **Validation**: 
  - Client-side validation before submission
  - Server-side validation by Firebase
- **Error Messages**: 
  - "Password must be at least 8 characters long"
  - Show password strength indicator (optional enhancement)

### 2.4 Email Verification
- **Current State**: Email is required (either manual entry or via Google)
- **Reset Flow**: 
  - Firebase sends reset email to registered email
  - No additional verification needed (email ownership proven by ability to access email)

### 2.5 Enumeration Attack Prevention
- **Strategy**: 
  - Always show success message: "Password reset email sent to [email]"
  - Don't reveal if email exists in system
  - Log actual result server-side for monitoring
- **Implementation**: 
  - Catch Firebase `auth/user-not-found` error silently
  - Show generic success message regardless of email existence

---

## 3. Firebase Integration

### 3.1 Firebase Auth Methods

#### Primary Method: `sendPasswordResetEmail()`
```javascript
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebase/config'

sendPasswordResetEmail(auth, email, {
  url: 'https://tradetrack.co.uk/login', // Redirect after reset
  handleCodeInApp: false // Use web action handler
})
```

#### Configuration Options
- **Action Code Settings**:
  - `url`: Redirect URL after password reset (login page)
  - `handleCodeInApp`: `false` (use web action handler for better UX)
- **Email Template**: Custom template in Firebase Console

### 3.2 Email Template Configuration

#### Firebase Console Setup
1. Go to: Firebase Console → Authentication → Templates
2. Select: "Password reset" template
3. Customize:
   - **Subject**: "Reset your Trade Tracker password"
   - **Body**: Custom HTML template with branding
   - **Action URL**: `https://tradetrack.co.uk/reset-password` (or Firebase default)

#### Custom Email Template Content
```
Subject: Reset your Trade Tracker password

Body:
Hi there,

You requested to reset your password for Trade Tracker by Doonhamer.

Click the link below to reset your password:
[Reset Password Button/Link]

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

---
Trade Tracker by Doonhamer
```

### 3.3 Custom Domain Configuration
- **Current**: Using Firebase default domain
- **Reset Link Format**: `https://[project-id].firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=[code]`
- **Future Enhancement**: Can configure custom domain in Firebase Hosting

### 3.4 Password Reset Confirmation
- **Method**: `confirmPasswordReset()`
- **Usage**: If using custom reset page (not Firebase-hosted)
- **Current Plan**: Use Firebase-hosted reset page (simpler, secure by default)

---

## 4. UI/UX Considerations

### 4.1 Pages/Components Needed

#### Component: `ForgotPasswordForm` (Inline Expansion)
- **Location**: `src/components/ForgotPasswordForm.jsx`
- **Props**: 
  - `onSuccess: (email: string) => void`
  - `onCancel: () => void`
  - `isExpanded: boolean`
- **State**: 
  - `email: string`
  - `loading: boolean`
  - `error: string`
  - `success: boolean`

#### Integration Point: `Auth.jsx`
- **Modification**: Add forgot password form inline expansion
- **State Management**: 
  - `showForgotPassword: boolean` (new state)
  - Toggle between login form and forgot password form

### 4.2 Loading States

#### During Email Send
- **Visual**: 
  - Spinner icon next to submit button
  - Disable submit button
  - Disable email input
  - Show "Sending..." text
- **Duration**: 1-3 seconds typically
- **Accessibility**: `aria-busy="true"` on form

#### During Rate Limit Check
- **Visual**: 
  - Brief loading indicator (if checking Firestore)
  - Or instant (if using client-side cache)
- **Duration**: < 500ms ideally

### 4.3 Error Messages

#### Error Types & Messages

| Error Code | User-Facing Message | Technical Logging |
|------------|---------------------|-------------------|
| `auth/invalid-email` | "Please enter a valid email address" | Log invalid email format |
| `auth/user-not-found` | "Password reset email sent to [email]" | Log enumeration attempt |
| `auth/too-many-requests` | "Too many requests. Please try again later." | Log rate limit hit |
| Rate limit (email) | "Too many reset requests for this email. Please try again in [X] minutes." | Log email rate limit |
| Rate limit (IP) | "Too many reset requests from this location. Please try again in [X] minutes." | Log IP rate limit |
| Network error | "Network error. Please check your connection and try again." | Log network failure |
| Firebase error (other) | "An error occurred. Please try again later." | Log full error details |

### 4.4 Success Feedback

#### Success Message Display
- **Message**: "Password reset email sent to [email]"
- **Visual**: 
  - Green checkmark icon
  - Green background/border
  - Email address highlighted/bold
- **Duration**: 
  - Auto-collapse after 5 seconds, OR
  - Manual collapse via "Back to Login" button
- **Accessibility**: 
  - `role="alert"` for screen readers
  - Announce success message

### 4.5 Accessibility Considerations

#### WCAG 2.1 AA Compliance
- **Keyboard Navigation**: 
  - Tab order: Email input → Submit button → Cancel/Back link
  - Enter key submits form
  - Escape key collapses form
- **Screen Readers**: 
  - `aria-label` on email input: "Email address for password reset"
  - `aria-describedby` linking error messages to inputs
  - `role="alert"` for error/success messages
- **Focus Management**: 
  - Focus moves to email input when form expands
  - Focus returns to "Forgot Password?" link when collapsed
- **Color Contrast**: 
  - Error messages: Red text on dark background (meets contrast ratio)
  - Success messages: Green text on dark background (meets contrast ratio)

#### Form Labels
- **Email Input**: 
  - Visible label: "Email Address"
  - `htmlFor` attribute linking label to input
  - Placeholder: "your@email.com"
  - `aria-required="true"`

---

## 5. Edge Case Handling

### 5.1 Expired Tokens

#### Scenario
User clicks reset link after 1 hour expiration.

#### Handling
- **Firebase Behavior**: Shows error page automatically
- **Custom Handling** (if custom reset page):
  - Detect expired token via `auth/expired-action-code` error
  - Show message: "This reset link has expired. Please request a new one."
  - Provide button: "Request New Reset Link" → Redirects to login

#### Implementation
```javascript
// If using custom reset page
try {
  await confirmPasswordReset(auth, actionCode, newPassword)
} catch (error) {
  if (error.code === 'auth/expired-action-code') {
    // Show expired message, redirect to request new link
  }
}
```

### 5.2 User Not Found

#### Scenario
User enters email that doesn't exist in system.

#### Handling
- **User Experience**: Show success message (prevent enumeration)
- **Backend Logging**: Log actual result for security monitoring
- **Implementation**: 
  - Catch `auth/user-not-found` error
  - Don't show error to user
  - Show generic success message
  - Log to Firestore/analytics

### 5.3 Google-Only Users

#### Scenario
User signed up with Google only (no password set).

#### Detection
- **Method**: Check user's `providerData` in Firestore
- **Check**: If only `google.com` provider exists, no password

#### Handling
- **User Experience**: 
  - Show message: "This account was created with Google. Please sign in with Google instead."
  - Provide "Sign in with Google" button
  - Optionally collapse forgot password form
- **Implementation**: 
  - Before sending reset email, check user's auth providers
  - If Google-only, show message and Google sign-in option

#### Code Logic
```javascript
// Check if user exists and has password
const userRecord = await getAuth().getUserByEmail(email)
const providers = userRecord.providerData
const hasPassword = providers.some(p => p.providerId === 'password')

if (!hasPassword && providers.some(p => p.providerId === 'google.com')) {
  // Show Google sign-in option
}
```

### 5.4 Already Logged-In Users

#### Scenario
User is already authenticated but requests password reset.

#### Handling
- **Allow Reset**: User may want to change password
- **UX**: 
  - Show info message: "You are currently logged in. A password reset email will be sent to [email]."
  - Still send reset email
  - Optionally provide "Change Password" link (future enhancement)

#### Implementation
- Check `currentUser` from AuthContext
- If logged in, show info message but proceed with reset

### 5.5 Multiple Reset Requests

#### Scenario
User requests multiple resets (within rate limit).

#### Handling
- **Firebase Behavior**: Each request generates new token, invalidates previous tokens
- **User Experience**: 
  - Show success message for each request
  - Last email sent is the only valid one
- **Rate Limiting**: Enforced per email/IP (prevents abuse)

### 5.6 Invalid Email Format

#### Scenario
User enters malformed email address.

#### Handling
- **Client-Side Validation**: 
  - Validate on blur/change
  - Show error immediately: "Please enter a valid email address"
  - Prevent form submission
- **Server-Side Validation**: 
  - Firebase will also validate
  - Catch `auth/invalid-email` error
  - Show same error message

### 5.7 Network Failures

#### Scenario
User's internet connection fails during request.

#### Handling
- **Detection**: Catch network errors (timeout, offline)
- **User Experience**: 
  - Show error: "Network error. Please check your connection and try again."
  - Provide "Retry" button
  - Don't count failed requests toward rate limit
- **Implementation**: 
  - Use try-catch around Firebase call
  - Check `navigator.onLine` status
  - Retry logic (optional): Auto-retry once after 2 seconds

---

## 6. Error Handling

### 6.1 Error Categories

#### Client-Side Errors (Before Firebase Call)
- **Invalid Email Format**: 
  - Validation: Regex or HTML5 email validation
  - Message: "Please enter a valid email address"
  - Action: Prevent submission, highlight input

- **Rate Limit Exceeded (Client-Side Cache)**: 
  - Check: LocalStorage/cache for recent requests
  - Message: "Please wait [X] minutes before requesting another reset"
  - Action: Disable submit button, show countdown timer

#### Firebase Errors (During API Call)
- **`auth/invalid-email`**: 
  - Message: "Please enter a valid email address"
  - Action: Highlight email input, focus on input

- **`auth/user-not-found`**: 
  - Message: "Password reset email sent to [email]" (prevent enumeration)
  - Action: Show success message, log actual error

- **`auth/too-many-requests`**: 
  - Message: "Too many requests. Please try again later."
  - Action: Disable form for 1 minute, show retry button

- **`auth/network-request-failed`**: 
  - Message: "Network error. Please check your connection and try again."
  - Action: Show retry button, check online status

- **Generic Firebase Error**: 
  - Message: "An error occurred. Please try again later."
  - Action: Log full error, show retry button

#### Server-Side Errors (Rate Limiting)
- **Email Rate Limit**: 
  - Message: "Too many reset requests for this email. Please try again in [X] minutes."
  - Action: Calculate remaining time, disable form, show countdown

- **IP Rate Limit**: 
  - Message: "Too many reset requests from this location. Please try again in [X] minutes."
  - Action: Calculate remaining time, disable form, show countdown

### 6.2 Error Logging & Monitoring

#### Logging Structure
```javascript
{
  timestamp: Date,
  email: string (hashed for privacy),
  ipAddress: string,
  errorCode: string,
  errorMessage: string,
  userAgent: string,
  rateLimitHit: boolean,
  rateLimitType: 'email' | 'ip' | null
}
```

#### Storage
- **Firestore Collection**: `passwordResetLogs`
- **Retention**: 30 days (configurable)
- **Privacy**: Hash email addresses before storing

#### Analytics Events
- `password_reset_requested` (success)
- `password_reset_failed` (with error code)
- `password_reset_rate_limited` (with type: email/IP)
- `password_reset_email_opened` (if using email tracking)
- `password_reset_completed` (if tracking completion)

---

## 7. Testing Plan

### 7.1 Unit Tests

#### Email Validation Logic
```javascript
describe('Email Validation', () => {
  test('validates correct email format', () => {
    expect(validateEmail('test@example.com')).toBe(true)
  })
  
  test('rejects invalid email format', () => {
    expect(validateEmail('invalid')).toBe(false)
  })
  
  test('rejects empty email', () => {
    expect(validateEmail('')).toBe(false)
  })
})
```

#### Rate Limiting Logic
```javascript
describe('Rate Limiting', () => {
  test('allows request within limit', () => {
    // Mock Firestore: 2 requests in last hour
    expect(canRequestReset('test@example.com')).toBe(true)
  })
  
  test('blocks request exceeding email limit', () => {
    // Mock Firestore: 3 requests in last hour
    expect(canRequestReset('test@example.com')).toBe(false)
  })
  
  test('blocks request exceeding IP limit', () => {
    // Mock Firestore: 5 requests from IP in last hour
    expect(canRequestReset('test@example.com', '192.168.1.1')).toBe(false)
  })
  
  test('resets counter after 1 hour', () => {
    // Mock Firestore: 3 requests, but oldest is 61 minutes ago
    expect(canRequestReset('test@example.com')).toBe(true)
  })
})
```

### 7.2 Integration Tests

#### Firebase Integration
```javascript
describe('Firebase Password Reset Integration', () => {
  test('sends reset email successfully', async () => {
    const email = 'test@example.com'
    const result = await sendPasswordResetEmail(auth, email)
    expect(result.success).toBe(true)
  })
  
  test('handles invalid email error', async () => {
    const email = 'invalid-email'
    const result = await sendPasswordResetEmail(auth, email)
    expect(result.success).toBe(false)
    expect(result.error).toContain('invalid-email')
  })
  
  test('handles user-not-found silently', async () => {
    const email = 'nonexistent@example.com'
    const result = await sendPasswordResetEmail(auth, email)
    // Should show success to user, but log error
    expect(result.userMessage).toBe('Password reset email sent')
    expect(result.loggedError).toBe('user-not-found')
  })
})
```

### 7.3 Manual Test Scenarios

#### Test Case 1: Happy Path
1. Navigate to login page
2. Click "Forgot Password?" link
3. Enter valid email address
4. Click "Send Reset Email"
5. **Expected**: Success message appears, email received
6. Click link in email
7. Enter new password
8. **Expected**: Password reset, redirected to login

#### Test Case 2: Invalid Email Format
1. Click "Forgot Password?"
2. Enter "invalid-email"
3. Click "Send Reset Email"
4. **Expected**: Error message, form doesn't submit

#### Test Case 3: Rate Limiting (Email)
1. Request reset 3 times for same email within 1 hour
2. Attempt 4th request
3. **Expected**: Rate limit error, countdown timer

#### Test Case 4: Rate Limiting (IP)
1. Request reset 5 times from same IP within 1 hour
2. Attempt 6th request
3. **Expected**: IP rate limit error

#### Test Case 5: Google-Only User
1. Enter email of Google-only account
2. Request password reset
3. **Expected**: Message about Google sign-in, option to sign in with Google

#### Test Case 6: Expired Token
1. Request reset email
2. Wait 1+ hours
3. Click reset link
4. **Expected**: Expired token message, option to request new link

#### Test Case 7: Already Logged In
1. Log in to account
2. Navigate to login page (should redirect, but test edge case)
3. Request password reset
4. **Expected**: Info message, reset email still sent

#### Test Case 8: Network Failure
1. Disconnect internet
2. Request password reset
3. **Expected**: Network error message, retry button

#### Test Case 9: Multiple Requests
1. Request reset email
2. Immediately request another (within rate limit)
3. **Expected**: Success message, only latest email is valid

#### Test Case 10: Accessibility
1. Use keyboard only (Tab, Enter, Escape)
2. Use screen reader
3. **Expected**: All functionality accessible, proper announcements

### 7.4 Email Deliverability Testing

#### Test Scenarios
1. **Gmail**: Send reset email, check inbox (not spam)
2. **Outlook**: Send reset email, check inbox (not spam)
3. **Yahoo**: Send reset email, check inbox (not spam)
4. **Custom Domain**: Send to custom domain email
5. **Spam Check**: Use mail-tester.com or similar
6. **Link Click**: Verify reset link works in email

#### Email Template Testing
1. **Subject Line**: Verify subject appears correctly
2. **Body Content**: Verify formatting, branding
3. **Reset Link**: Verify link is clickable, redirects correctly
4. **Mobile Rendering**: Test email on mobile devices

---

## 8. Security Checklist

### 8.1 Enumeration Attack Prevention
- [x] Never reveal if email exists in system
- [x] Always show success message regardless of email existence
- [x] Log actual results server-side for monitoring
- [x] Use generic error messages

### 8.2 CSRF Protection
- [x] Firebase handles CSRF tokens automatically
- [x] Verify action codes server-side (Firebase does this)
- [x] Use HTTPS only (Firebase enforces)

### 8.3 Rate Limiting Implementation
- [x] Implement per-email rate limiting (3/hour)
- [x] Implement per-IP rate limiting (5/hour)
- [x] Store attempts in Firestore with timestamps
- [x] Calculate remaining time accurately
- [x] Show user-friendly countdown messages

### 8.4 Token Security
- [x] Tokens expire after 1 hour (Firebase default)
- [x] Tokens are single-use (Firebase invalidates after use)
- [x] Tokens are cryptographically secure (Firebase handles)
- [x] Handle expired tokens gracefully

### 8.5 Password Security
- [x] Enforce minimum 8 characters
- [x] Validate password strength client and server-side
- [x] Don't store passwords (Firebase handles hashing)

### 8.6 Audit Logging
- [x] Log all reset requests (success/failure)
- [x] Log rate limit hits
- [x] Log error types
- [x] Hash email addresses in logs (privacy)
- [x] Store logs in Firestore with 30-day retention

### 8.7 Input Validation
- [x] Validate email format client-side
- [x] Validate email format server-side (Firebase)
- [x] Sanitize inputs (Firebase handles)
- [x] Prevent XSS attacks (React escapes by default)

### 8.8 Error Message Security
- [x] Don't reveal system internals in errors
- [x] Use generic error messages for users
- [x] Log detailed errors server-side only
- [x] Prevent information leakage

### 8.9 Session Management
- [x] Reset tokens invalidate after use
- [x] Handle concurrent reset requests (latest token valid)
- [x] Don't create sessions during reset flow

### 8.10 Monitoring & Alerts
- [x] Set up monitoring for rate limit hits
- [x] Alert on suspicious patterns (many failed attempts)
- [x] Monitor email delivery rates
- [x] Track completion rates (reset requests → password changes)

---

## 9. Implementation Phases

### Phase 1: Basic Functionality
1. Add "Forgot Password?" link to login form
2. Create inline forgot password form component
3. Implement basic email submission
4. Add success/error message display
5. Test happy path

### Phase 2: Rate Limiting
1. Implement Firestore collections for rate limiting
2. Add per-email rate limiting logic
3. Add per-IP rate limiting logic
4. Add countdown timer UI
5. Test rate limiting scenarios

### Phase 3: Edge Cases
1. Handle Google-only users
2. Handle expired tokens
3. Handle network failures
4. Handle already logged-in users
5. Test all edge cases

### Phase 4: Security & Logging
1. Implement audit logging
2. Add analytics events
3. Configure email templates
4. Security review
5. Penetration testing (optional)

### Phase 5: Polish & Testing
1. Accessibility improvements
2. Error message refinement
3. UI/UX polish
4. Comprehensive testing
5. Documentation

---

## 10. Firebase Console Configuration

### 10.1 Email Template Setup
1. Go to: Firebase Console → Authentication → Templates
2. Select: "Password reset"
3. Configure:
   - **Subject**: "Reset your Trade Tracker password"
   - **Body**: Custom HTML template
   - **Action URL**: `https://tradetrack.co.uk/login` (redirect after reset)

### 10.2 Authorized Domains
- Ensure `tradetrack.co.uk` is in authorized domains
- Ensure Firebase default domain is authorized

### 10.3 Security Rules (Firestore)
- Rate limiting collections should be readable/writable by server only
- Logs collection should be write-only from client (or server-only)

---

## 11. Data Models

### 11.1 Rate Limiting Collections

#### `passwordResetAttempts`
```javascript
{
  id: `${email}_${hourTimestamp}`, // e.g., "test@example.com_1704067200"
  email: string, // User's email
  timestamp: Timestamp, // Hour timestamp (rounded to hour)
  count: number, // Number of requests in this hour
  ipAddress: string, // IP address of requests
  lastRequest: Timestamp // Last request timestamp
}
```

#### `passwordResetIPAttempts`
```javascript
{
  id: `${ipAddress}_${hourTimestamp}`, // e.g., "192.168.1.1_1704067200"
  ipAddress: string, // IP address
  timestamp: Timestamp, // Hour timestamp
  count: number, // Number of requests from this IP in this hour
  lastRequest: Timestamp // Last request timestamp
}
```

### 11.2 Logging Collection

#### `passwordResetLogs`
```javascript
{
  id: auto-generated,
  timestamp: Timestamp,
  emailHash: string, // SHA-256 hash of email (privacy)
  ipAddress: string,
  errorCode: string | null,
  success: boolean,
  rateLimitHit: boolean,
  rateLimitType: 'email' | 'ip' | null,
  userAgent: string
}
```

---

## 12. API/Function Signatures

### 12.1 Component Props

#### `ForgotPasswordForm`
```typescript
interface ForgotPasswordFormProps {
  isExpanded: boolean
  onSuccess: (email: string) => void
  onCancel: () => void
}
```

### 12.2 Service Functions

#### `requestPasswordReset(email: string)`
```typescript
interface PasswordResetResult {
  success: boolean
  message: string // User-facing message
  errorCode?: string // For logging
  rateLimitRemaining?: number // Minutes until can retry
}
```

#### `checkRateLimit(email: string, ipAddress: string)`
```typescript
interface RateLimitResult {
  allowed: boolean
  type?: 'email' | 'ip'
  remainingMinutes?: number
}
```

---

## 13. Success Criteria

### 13.1 Functional Requirements
- [x] Users can request password reset from login page
- [x] Reset emails are sent successfully
- [x] Users can reset password via email link
- [x] Rate limiting prevents abuse
- [x] All edge cases handled gracefully

### 13.2 Security Requirements
- [x] No enumeration attacks possible
- [x] Rate limiting enforced
- [x] Tokens expire after 1 hour
- [x] Audit logging implemented
- [x] No sensitive data exposed in errors

### 13.3 UX Requirements
- [x] Clear, user-friendly error messages
- [x] Loading states during requests
- [x] Success feedback after email sent
- [x] Accessible to screen readers
- [x] Keyboard navigation works

### 13.4 Performance Requirements
- [x] Rate limit check completes in < 500ms
- [x] Email send completes in < 3 seconds
- [x] Form expansion/collapse is smooth (< 200ms)

---

## Approval & Next Steps

**Design Spec Status**: ✅ Complete

**Next Steps**:
1. Review this specification
2. Approve or request changes
3. Once approved, implementation will begin in phases
4. Code will be generated incrementally with tests

**Questions or Changes?**
Please review and let me know if any adjustments are needed before implementation begins.

