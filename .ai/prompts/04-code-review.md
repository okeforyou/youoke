# 🕵️‍♂️ Code Review Prompt

**Copy and paste the text below into your AI chat before finalizing complex code:**

```text
Before we finish, please perform a strict Code Review on the changes we just made:
1. Security: Are there any hardcoded secrets or unhandled inputs?
2. Performance: Can we optimize the React re-renders, loops, or database queries?
3. Edge Cases: What happens on empty states, network failures, or invalid inputs?
4. TDD: Have we tested the core logic?
If you find issues, list them. Otherwise, confirm it's ready.
```
