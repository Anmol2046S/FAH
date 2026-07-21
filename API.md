# API Documentation - FAH

## Base URL
```
http://localhost:3000/api
```

## Authentication
Not currently required (planned for v1.1.0)

## Endpoints

### 1. Analyze Food

**POST** `/api/analyze`

Analyze nutritional content and health impact of food.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "food": "apple",
  "quantity": 100,
  "unit": "g",
  "cuisineType": "raw"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "food": "apple",
    "quantity": 100,
    "unit": "g",
    "nutrition": {
      "calories": 52,
      "protein": 0.26,
      "carbs": 13.8,
      "fat": 0.17,
      "fiber": 2.4,
      "sugar": 10.4,
      "sodium": 2
    },
    "healthScore": 9.2,
    "vitamins": {
      "vitaminC": "4.6mg",
      "vitaminK": "2.2µg",
      "potassium": "107mg"
    },
    "benefits": [
      "High in fiber",
      "Rich in antioxidants",
      "Low in calories",
      "Good for digestion"
    ],
    "warnings": [],
    "recommendations": "Great for daily consumption"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Food not found in database",
  "statusCode": 404
}
```

---

### 2. Health Recommendations

**GET** `/api/health?diet=vegetarian&goal=weight_loss`

Get personalized health recommendations.

**Query Parameters:**
- `diet` (string): dietary type (omnivore, vegetarian, vegan, keto)
- `goal` (string): health goal (weight_loss, muscle_gain, balanced)
- `allergies` (string): comma-separated list of allergies

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      "Increase protein intake",
      "Reduce processed foods",
      "Stay hydrated",
      "Regular exercise"
    ],
    "dailyCalories": 2000,
    "macroRatio": {
      "protein": "30%",
      "carbs": "40%",
      "fat": "30%"
    },
    "foodsToAvoid": ["processed sugar", "refined carbs"],
    "foodsToEat": ["vegetables", "lean proteins", "whole grains"]
  }
}
```

---

### 3. Nutrition Database

**GET** `/api/nutrition?search=chicken`

Search nutrition database.

**Query Parameters:**
- `search` (string): food name to search
- `limit` (integer): number of results (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Chicken Breast",
      "servingSize": "100g",
      "calories": 165,
      "protein": 31,
      "carbs": 0,
      "fat": 3.6
    }
  ],
  "total": 1
}
```

---

### 4. Health Score

**POST** `/api/health-score`

Calculate overall health score based on diet.

**Request:**
```json
{
  "meals": [
    {"food": "apple", "quantity": 100},
    {"food": "chicken", "quantity": 150},
    {"food": "rice", "quantity": 150}
  ],
  "period": "daily"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overallScore": 7.8,
    "breakdown": {
      "nutrition": 8.2,
      "balance": 7.5,
      "variety": 7.1
    },
    "suggestions": [
      "Add more vegetables",
      "Include healthy fats"
    ]
  }
}
```

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Success |
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Missing/invalid auth |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Internal error |
| 422 | Unprocessable | Validation failed |

## Rate Limiting

Currently unlimited. Planned for production:
- 100 requests per minute for free users
- 1000 requests per minute for premium

## Request Examples

### JavaScript Fetch

```javascript
// Analyze food
fetch('http://localhost:3000/api/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    food: 'apple',
    quantity: 100,
    unit: 'g'
  })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));

// Get health recommendations
fetch('http://localhost:3000/api/health?diet=vegetarian&goal=weight_loss')
  .then(res => res.json())
  .then(data => console.log(data));
```

### cURL

```bash
# Analyze food
curl -X POST http://localhost:3000/api/analyze \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\"food\":\"apple\",\"quantity\":100,\"unit\":\"g\"}'

# Get recommendations
curl http://localhost:3000/api/health?diet=vegetarian&goal=weight_loss
```

## Response Format

All endpoints return JSON with standard format:

**Success:**
```json
{
  \"success\": true,
  \"data\": { ... }
}
```

**Error:**
```json
{
  \"success\": false,
  \"error\": \"Error message\",
  \"statusCode\": 400
}
```

## Testing

Use these tools:
- [Postman](https://www.postman.com/)
- [Insomnia](https://insomnia.rest/)
- cURL
- Browser console (GET only)

## CORS

CORS is enabled for localhost development. Production requires configuration.

## Webhooks

Planned for v1.2.0

## Rate Limiting Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1234567890
```

---

**Last Updated:** 2026-07-21
