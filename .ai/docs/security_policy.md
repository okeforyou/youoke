# 🔒 Security Policy

## 🛑 Secrets & Credentials
- **NEVER** hardcode API keys, passwords, connection strings, or any sensitive information in the source code.
- Always use environment variables loaded from `.env`.

## 📁 Git & `.env`
- Verify that `.gitignore` contains `.env`, `.env.local`, and any other credential files before committing.
- Ensure no sensitive data is staged before running `git commit`.

## 🛡️ Best Practices
- *(Add project-specific security rules here)*
