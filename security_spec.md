# Security Spec

## 1. Data Invariants
- A task cannot exist without a valid `user_id` that belongs to the user making the request.
- A calendar event cannot exist without a valid `user_id` that belongs to the user.
- Status of a task must be one of `pending`, `in_progress`, `completed`, `failed`.
- Priority score must be a number.

## 2. Dirty Dozen Payloads
- Missing user_id
- Spoofed user_id
- Missing title
- Wrong type for priority_score (e.g. string)
- Invalid status string
- Extra ghost field (e.g., `isAdmin: true`)
- Empty shadow_artifacts object when required
- String over 1000 chars for title
- And so on...

## 3. Test Runner
We will generate firestore.rules and a corresponding test file.
