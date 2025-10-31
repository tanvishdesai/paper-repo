# 🔑 API Usage Guide

Welcome to the GATE Question Bank API! This guide will help you integrate our comprehensive collection of GATE exam questions into your applications.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Get Subjects](#1-get-subjects)
  - [Get Questions](#2-get-questions)
- [Query Parameters](#query-parameters)
- [Code Examples](#code-examples)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Rate Limits](#rate-limits)
- [Best Practices](#best-practices)

---

## 🚀 Getting Started

### Step 1: Create an Account

1. Visit the application and click **"Sign In"**
2. Sign up using:
   - Email and password
   - Google account
   - GitHub account

### Step 2: Generate an API Key

1. Once signed in, navigate to **API Keys** page (click your profile → "API Keys")
2. Click **"Generate New Key"**
3. Give your key a descriptive name (e.g., "My Mobile App")
4. Copy the generated key immediately - **you won't be able to see it again!**
5. Store it securely (use environment variables, never commit to Git)

### Step 3: Make Your First Request

Use your API key in the `X-API-Key` header to authenticate requests.

---

## 🔐 Authentication

All API requests require authentication using an API key. Include your API key in the request header:

```
X-API-Key: your_api_key_here
```

**Security Notes:**
- Never expose your API key in client-side code
- Use environment variables to store keys
- Rotate keys periodically
- Delete compromised keys immediately

---

## 📡 API Endpoints

Base URL: `https://your-domain.com/api/v1`  
For local development: `http://localhost:3000/api/v1`

### 1. Get Subjects

Retrieve a list of all available subjects.

**Endpoint:** `GET /api/v1/subjects`

**Example Request:**
```bash
curl -X GET "https://your-domain.com/api/v1/subjects" \
  -H "X-API-Key: your_api_key_here"
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    "Algorithms",
    "Data Structures",
    "Operating Systems",
    "Databases",
    "Computer Networks",
    "Computer Organization",
    "Theory of Computation",
    "Compiler Design",
    "Digital Logic",
    "Engineering Mathematics",
    "General Aptitude"
  ]
}
```

---

### 2. Get Questions

Retrieve questions with optional filtering, searching, sorting, and pagination.

**Endpoint:** `GET /api/v1/questions`

**Example Request:**
```bash
curl -X GET "https://your-domain.com/api/v1/questions?subject=Algorithms&limit=10" \
  -H "X-API-Key: your_api_key_here"
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "year": 2023,
      "paper_code": "CS",
      "question_no": "Q.25",
      "question_text": "What is the time complexity of merge sort?",
      "options": [
        "(A) O(n)",
        "(B) O(n log n)",
        "(C) O(n^2)",
        "(D) O(log n)"
      ],
      "subject": "Algorithms",
      "chapter": "Sorting",
      "subtopic": "Merge Sort",
      "theoretical_practical": "theoretical",
      "marks": 2,
      "provenance": "GATE 2023",
      "confidence": 0.95
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## 🔍 Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `subject` | string | Filter by subject name | `subject=Algorithms` |
| `year` | number | Filter by exam year | `year=2023` |
| `marks` | number | Filter by marks value | `marks=2` |
| `type` | string | Filter by question type | `type=theoretical` |
| `search` | string | Search in question text and topics | `search=sorting` |
| `sort` | string | Sort order | `sort=year-desc` |
| `limit` | number | Results per page (max: 1000) | `limit=50` |
| `offset` | number | Pagination offset | `offset=100` |

### Sort Options
- `year-desc` - Newest first (default)
- `year-asc` - Oldest first
- `marks-desc` - Highest marks first
- `marks-asc` - Lowest marks first

### Type Options
- `theoretical` - Theory questions
- `practical` - Practical/numerical questions

---

## 💻 Code Examples

### JavaScript (fetch)

```javascript
const API_KEY = process.env.GATE_API_KEY;

async function getQuestions() {
  try {
    const response = await fetch(
      'https://your-domain.com/api/v1/questions?subject=Algorithms&limit=10',
      {
        headers: {
          'X-API-Key': API_KEY
        }
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Questions:', data.data);
      console.log('Total:', data.pagination.total);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

getQuestions();
```

### Node.js (axios)

```javascript
const axios = require('axios');

const API_KEY = process.env.GATE_API_KEY;

async function getQuestions() {
  try {
    const response = await axios.get(
      'https://your-domain.com/api/v1/questions',
      {
        params: {
          subject: 'Algorithms',
          year: 2023,
          limit: 10
        },
        headers: {
          'X-API-Key': API_KEY
        }
      }
    );
    
    console.log('Questions:', response.data.data);
  } catch (error) {
    if (error.response) {
      console.error('Error:', error.response.data.error);
    }
  }
}

getQuestions();
```

### Python (requests)

```python
import requests
import os

API_KEY = os.getenv('GATE_API_KEY')

def get_questions():
    url = 'https://your-domain.com/api/v1/questions'
    headers = {
        'X-API-Key': API_KEY
    }
    params = {
        'subject': 'Algorithms',
        'year': 2023,
        'limit': 10
    }
    
    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        
        data = response.json()
        if data['success']:
            print(f"Found {data['pagination']['total']} questions")
            for question in data['data']:
                print(f"Q{question['question_no']}: {question['question_text']}")
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")

get_questions()
```

### PowerShell

```powershell
$API_KEY = $env:GATE_API_KEY

$headers = @{
    "X-API-Key" = $API_KEY
}

$params = @{
    subject = "Algorithms"
    limit = 10
    year = 2023
}

try {
    $response = Invoke-RestMethod `
        -Uri "https://your-domain.com/api/v1/questions" `
        -Method Get `
        -Headers $headers `
        -Body $params
    
    Write-Host "Total Questions: $($response.pagination.total)"
    $response.data | ForEach-Object {
        Write-Host "$($_.question_no): $($_.question_text)"
    }
} catch {
    Write-Error "Error: $_"
}
```

### PHP

```php
<?php
$apiKey = getenv('GATE_API_KEY');

$url = 'https://your-domain.com/api/v1/questions?' . http_build_query([
    'subject' => 'Algorithms',
    'year' => 2023,
    'limit' => 10
]);

$options = [
    'http' => [
        'header' => "X-API-Key: $apiKey\r\n",
        'method' => 'GET'
    ]
];

$context = stream_context_create($options);
$response = file_get_contents($url, false, $context);

if ($response !== false) {
    $data = json_decode($response, true);
    
    if ($data['success']) {
        echo "Total Questions: " . $data['pagination']['total'] . "\n";
        foreach ($data['data'] as $question) {
            echo $question['question_no'] . ": " . $question['question_text'] . "\n";
        }
    }
}
?>
```

### Java (with HttpClient)

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class GateAPIClient {
    private static final String API_KEY = System.getenv("GATE_API_KEY");
    private static final String BASE_URL = "https://your-domain.com/api/v1";
    
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        
        String url = BASE_URL + "/questions?subject=Algorithms&limit=10";
        
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("X-API-Key", API_KEY)
            .GET()
            .build();
        
        HttpResponse<String> response = client.send(
            request, 
            HttpResponse.BodyHandlers.ofString()
        );
        
        System.out.println("Response: " + response.body());
    }
}
```

### Ruby

```ruby
require 'net/http'
require 'json'
require 'uri'

api_key = ENV['GATE_API_KEY']
uri = URI('https://your-domain.com/api/v1/questions')
uri.query = URI.encode_www_form(
  subject: 'Algorithms',
  limit: 10,
  year: 2023
)

http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true

request = Net::HTTP::Get.new(uri)
request['X-API-Key'] = api_key

response = http.request(request)
data = JSON.parse(response.body)

if data['success']
  puts "Total Questions: #{data['pagination']['total']}"
  data['data'].each do |question|
    puts "#{question['question_no']}: #{question['question_text']}"
  end
end
```

---

## 📦 Response Format

### Success Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 500,
    "limit": 100,
    "offset": 0,
    "hasMore": true
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Invalid API key"
}
```

---

## ❌ Error Handling

### Common HTTP Status Codes

| Status Code | Description | Solution |
|-------------|-------------|----------|
| `200` | Success | Request processed successfully |
| `400` | Bad Request | Check your query parameters |
| `401` | Unauthorized | Verify your API key is correct |
| `403` | Forbidden | Check if your key is active |
| `429` | Rate Limit Exceeded | Wait before making more requests |
| `500` | Server Error | Contact support if persistent |

### Error Messages

- **"Missing API key"** - Add the `X-API-Key` header
- **"Invalid API key"** - Check your key is correct and active
- **"Rate limit exceeded"** - You've hit the 1,000 requests/day limit
- **"Inactive API key"** - Reactivate your key in the dashboard

---

## ⚡ Rate Limits

- **Limit:** 1,000 requests per day per API key
- **Reset:** Daily at midnight UTC
- **Headers:** Check `X-RateLimit-Remaining` in response headers

**Tips to stay within limits:**
- Cache responses when possible
- Use pagination efficiently
- Implement request batching
- Monitor your usage in the dashboard

---

## ✅ Best Practices

### 1. **Secure Your Keys**
```bash
# Use environment variables
export GATE_API_KEY="your_key_here"

# In .env file (never commit this!)
GATE_API_KEY=your_key_here
```

### 2. **Handle Errors Gracefully**
```javascript
async function safeAPICall() {
  try {
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    // Implement retry logic or fallback
  }
}
```

### 3. **Implement Caching**
```javascript
const cache = new Map();

async function getCachedQuestions(subject) {
  const cacheKey = `questions_${subject}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const data = await fetchQuestions(subject);
  cache.set(cacheKey, data);
  
  return data;
}
```

### 4. **Use Pagination Wisely**
```javascript
async function getAllQuestions(subject) {
  const allQuestions = [];
  let offset = 0;
  const limit = 100;
  
  while (true) {
    const response = await fetch(
      `${API_URL}/questions?subject=${subject}&limit=${limit}&offset=${offset}`,
      { headers }
    );
    
    const data = await response.json();
    allQuestions.push(...data.data);
    
    if (!data.pagination.hasMore) break;
    offset += limit;
  }
  
  return allQuestions;
}
```

### 5. **Monitor Your Usage**
- Regularly check the API Keys dashboard
- Set up alerts for rate limit warnings
- Track which keys are being used
- Rotate keys periodically

---

## 🎯 Use Cases

### Example 1: Build a Practice Quiz App
```javascript
async function generateQuiz(subject, count = 10) {
  const response = await fetch(
    `${API_URL}/questions?subject=${subject}&limit=${count}&sort=random`,
    { headers: { 'X-API-Key': API_KEY } }
  );
  
  const data = await response.json();
  return data.data;
}
```

### Example 2: Create a Study Planner
```javascript
async function getQuestionsByDifficulty(subject) {
  const easy = await fetch(
    `${API_URL}/questions?subject=${subject}&marks=1`,
    { headers: { 'X-API-Key': API_KEY } }
  );
  
  const hard = await fetch(
    `${API_URL}/questions?subject=${subject}&marks=2`,
    { headers: { 'X-API-Key': API_KEY } }
  );
  
  return {
    easy: (await easy.json()).data,
    hard: (await hard.json()).data
  };
}
```

### Example 3: Year-wise Analysis
```javascript
async function analyzeYearTrends(subject, startYear, endYear) {
  const trends = [];
  
  for (let year = startYear; year <= endYear; year++) {
    const response = await fetch(
      `${API_URL}/questions?subject=${subject}&year=${year}`,
      { headers: { 'X-API-Key': API_KEY } }
    );
    
    const data = await response.json();
    trends.push({
      year,
      count: data.pagination.total,
      avgMarks: calculateAverage(data.data, 'marks')
    });
  }
  
  return trends;
}
```

---

## 📞 Support

- **Documentation:** Check `/api-docs` page in the application
- **Issues:** Report bugs on GitHub
- **Questions:** Open a discussion on GitHub

---

## 📄 License

This API is provided as-is for educational purposes. Please use responsibly and respect the rate limits.

---

**Happy Coding! 🚀**

