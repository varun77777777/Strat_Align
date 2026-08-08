# REST API Documentation

Strat-Align backend endpoints provide JSON formatted payloads.

---

## 1. Express Backend Endpoints (Port 5000)

### `GET /health`
Returns database availability and system statistics.
```json
{
  "status": "ok",
  "timestamp": "2026-08-08T21:26:00.000Z",
  "database": "connected"
}
```

### `GET /api/teams`
Lists all 8 seeded teams with lightweight alignment information (cached for 10s).

### `GET /api/teams/:id`
Returns full history, active projects, and latest AI prediction model details for a single team.

### `GET /api/predictions`
Lists predictions and failure forecast scores sorted by risk index (cached for 30s).

### `GET /api/recommendations`
Lists all actionable items sorted by priority.

### `POST /api/recommendations/:id/apply`
Marks a recommendation as applied and calculates the projected score increase.

### `POST /api/analyze`
Submits communications logs for live concepts alignment analysis.

---

## 2. Python AI Service Endpoints (Port 8000)

### `POST /predict`
Executes classification predictions on raw alignment parameters using scikit-learn.

### `POST /analyze`
Compares strategy texts to communications logs via Gemini API.

### `POST /sentiment`
Calculates tone polarity ratios and identifies concern phrases via HuggingFace models.

### `POST /recommend`
Outputs structured prioritize lists of organizational interventions.
