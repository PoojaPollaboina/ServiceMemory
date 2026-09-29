# ServiceMemory — AI-Powered Service Intelligence

An AI-powered service intelligence platform that captures historical service experiences and makes them reusable for future incidents.

ServiceMemory helps teams preserve operational knowledge by connecting incidents, affected assets, measurements, actions, and outcomes into a persistent service memory that can be retrieved when similar problems occur.

🔗 Repository: "https://github.com/PoojaPollaboina/ServiceMemory"

---

## ✨ Features

- **Service Experience Memory** — stores historical incidents with structured asset, measurement, context, and outcome information.
- **Historical Context Retrieval** — retrieves relevant past service experiences to provide additional context for new incidents.
- **Incident Intelligence** — connects current service investigations with previously resolved incidents.
- **Continuous Knowledge Loop** — resolved incidents become reusable knowledge for future investigations.
- **Structured Service Data** — preserves important operational details instead of treating incidents as unstructured text.
- **AI-Assisted Investigation** — uses historical service context to support investigation and reasoning workflows.
- **Demo / Seed Workflow** — includes seed data representing historical service experiences for demonstrations and testing.
- **Automated Testing** — includes Vitest-based tests for important application and service logic.
- **Modern Web Interface** — Next.js-based application with a responsive interface for interacting with service intelligence.
- **Database-backed Memory** — persistent service experiences are stored using PostgreSQL through Supabase.

---

## 🧠 How It Works

ServiceMemory follows a continuous operational knowledge loop:

```text
┌──────────────────────┐
│   Service Incident   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│    Investigation     │
│  Asset + Measurements│
│      + Context       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│      Resolution      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Service Experience  │
│       Memory         │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Future Incident      │
│ Context Retrieval    │
└──────────────────────┘
