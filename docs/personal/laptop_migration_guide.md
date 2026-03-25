# System Migration & Handover Guide: Trading Bot & n8n Environment

This document provides a detailed breakdown of how to migrate your entire development environment to a new machine or share it securely with a collaborator.

---

## 1. Personal Migration (Old Laptop to New Laptop)

Before you shut down the old machine, follow these steps to ensure zero data loss.

### ✅ Git & Repository Sync
- Ensure all recent changes are pushed:
  ```powershell
  git add .
  git commit -m "Migration: Full system backup"
  git push origin [branch-name]
  ```

### ✅ Backup Sensitive Files (DO NOT FORGET)
These files are excluded from Git for security. You must copy them manually via USB or secure cloud:
1.  **Project `.env`**: `[Project_Path]\.env` (Contains Supabase & API keys).
2.  **MCP Config**: `C:\Users\[User]\.gemini\antigravity\mcp_config.json` (Required for AI tool access).
3.  **n8n Credentials**: Export manually from the n8n UI (Settings > Export) or find the n8n database file in `%HOMEPATH%\.n8n`.

### ⚙️ Detailed System Configurations
When setting up the new laptop, these configurations are essential for the bot to run correctly:

1.  **Environment Variables**:
    - Add Python to your Windows PATH during installation.
    - Set `PYTHONPATH=api` in your system environment variables if you run scripts from the root.
2.  **Power & Screen Settings**:
    - Go to **Settings > System > Power & Battery**.
    - Set "Screen and sleep" to **Never** when plugged in.
3.  **Execution Policy**:
    - Required to run `npm` and `python` scripts.
    - Run in Admin PowerShell: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`.
4.  **Node.js & Python**:
    - Install **Node.js (LTS)** and **Python 3.10+**.
    - Verify with `node -v` and `python --version`.

---

## 2. Essential Project Checklist (What to Copy)

If you are sharing this project or manually moving it without Git, use this list:

### 📁 Essential Folders
| Name | Description |
| :--- | :--- |
| **`api/`** | Python backend logic and models. |
| **`src/`** | React Frontend source code. |
| **`n8n/`** | Database schemas and workflow templates. |
| **`public/`** | Static assets and UI images. |
| **`data/`** | CSV datasets and signal logs. |
| **`.agent/`** | AI agent instructions and memory. |

### 📄 Essential Files
- `package.json` & `package-lock.json`
- `vite.config.ts`, `tsconfig.json`
- `transform_signals.py`
- `README.md`
- `.env.example` (Always include this as a template)

### ❌ Items to EXCLUDE
- `node_modules/` (Re-install via `npm install`)
- `.env` (Private - create your own for collaborators)
- `.git/` (Unless you want to share full history)
- `dist/` (Auto-generated build files)

---

## 3. Handover Guide (Sharing with Others)

When sharing this setup with a collaborator, follow these safety steps:

### 1. Create a `.env.example`
Never give your `.env` to someone else. Create a template instead:
```bash
PYTHONPATH=api
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-project-key
```

### 2. Export n8n Workflows
n8n workflows are not files by default.
1. Open n8n > Workflow > **Export to File**.
2. Save the `.json` in the `/n8n` folder.
3. Your collaborator can then **Import** this file into their own n8n instance.

### 3. Generate Requirements
Run this to create a library list for them:
```powershell
pip freeze > requirements.txt
```

---

## 4. Final Verification Checklist

- [ ] UI starts correctly (`npm run dev`).
- [ ] Python script runs without import errors (`python transform_signals.py`).
- [ ] n8n connects to Supabase via the provided keys.
- [ ] AI Assistant (Antigravity) can see the project context via the restored `brain` folder.

> [!WARNING]
> **Security Audit**: Before sharing a ZIP of this project, search the entire folder for the string "eyJ" (typical start of a Supabase key) to ensure no hardcoded secrets exist in your code.

