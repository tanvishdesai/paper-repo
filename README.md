# GATE CS Paper Annotation Processor

Automated pipeline to process GATE CS question paper PDFs and annotate them with syllabus topic mappings using OpenAI GPT-4.

## Features

✅ **Sequential PDF Processing** - Processes all question papers one by one  
✅ **Syllabus Mapping** - Maps each question to Subject → Chapter → Subtopic  
✅ **Rate Limit Handling** - Automatically waits when API limits are hit  
✅ **Multiple Implementations** - Both N8N workflow and Python script available  
✅ **JSON Output** - Structured annotations for easy data analysis  
✅ **Error Recovery** - Robust error handling and retry logic  

## Quick Start

### Option 1: Python Script (Recommended for Developers)

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set OpenAI API Key**
   ```bash
   # On Windows PowerShell
   $env:OPENAI_API_KEY="your-api-key-here"
   
   # On Linux/Mac
   export OPENAI_API_KEY="your-api-key-here"
   
   # Or create .env file
   cp .env.example .env
   # Edit .env and add your API key
   ```

3. **Run the Processor**
   ```bash
   python python_pdf_processor.py
   ```

4. **Check Output**
   - Annotations saved in `annotations/` folder
   - Each file named `{original}_annotations.json`
   - Processing log in `processing.log`

#### Advanced Usage

```bash
# Custom paths
python python_pdf_processor.py \
  --syllabus "path/to/syllabus.pdf" \
  --papers-folder "path/to/papers" \
  --output-folder "path/to/output"

# Different model
python python_pdf_processor.py --model "gpt-4o"

# Adjust delays
python python_pdf_processor.py --delay 5 --rate-limit-wait 600

# Full options
python python_pdf_processor.py --help
```

### Option 2: N8N Workflow (No-Code Automation)

1. **Install N8N**
   ```bash
   npm install n8n -g
   ```

2. **Start N8N**
   ```bash
   n8n start
   ```

3. **Import Workflow**
   - Open http://localhost:5678
   - Import `n8n_workflow_improved.json`
   - Configure OpenAI credentials
   - Update file paths

4. **Run Workflow**
   - Click "Execute Workflow"
   - Monitor progress in real-time

📖 **See [N8N_SETUP_GUIDE.md](N8N_SETUP_GUIDE.md) for detailed instructions**

## Project Structure

```
Paper Predictor/
├── CS/
│   └── CS/                          # Question paper PDFs
│       ├── CS2007.pdf
│       ├── CS2008.pdf
│       └── ... (22 total)
├── CS_2026_Syllabus.pdf            # Syllabus reference
├── annotations/                     # Generated annotations (created automatically)
│   ├── CS2007_annotations.json
│   ├── CS2008_annotations.json
│   └── ...
├── python_pdf_processor.py          # Python implementation
├── n8n_workflow_improved.json       # N8N workflow
├── requirements.txt                 # Python dependencies
├── N8N_SETUP_GUIDE.md              # N8N setup instructions
└── README.md                        # This file
```

## Output Format

Each annotation JSON contains an array of question objects:

```json
[
  {
    "year": 2024,
    "paper_code": "CS1",
    "question_no": "1",
    "question_text": "Which of the following is true about binary search trees?",
    "subject": "Programming and Data Structures",
    "chapter": "Trees",
    "subtopic": "Binary Search Trees",
    "theoretical_practical": "theoretical",
    "marks": 2,
    "provenance": "CS12024",
    "confidence": 0.95
  },
  {
    "year": 2024,
    "paper_code": "CS1",
    "question_no": "2",
    "question_text": "...",
    "subject": "Algorithms",
    "chapter": "Sorting",
    "subtopic": "Quick Sort",
    "theoretical_practical": "practical",
    "marks": 2,
    "provenance": "CS12024",
    "confidence": 0.88
  }
]
```

## Configuration

### Python Script Configuration

Edit these variables or use command-line arguments:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `--api-key` | `$OPENAI_API_KEY` | OpenAI API key |
| `--syllabus` | `CS_2026_Syllabus.pdf` | Syllabus PDF path |
| `--papers-folder` | `CS/CS` | Question papers folder |
| `--output-folder` | `annotations` | Output folder |
| `--model` | `gpt-4-turbo` | OpenAI model |
| `--delay` | `2` | Delay between requests (seconds) |
| `--rate-limit-wait` | `300` | Wait time on rate limit (seconds) |

### Prompt Customization

Edit the prompt in:
- **Python**: `PaperProcessor.SYSTEM_PROMPT` in `python_pdf_processor.py`
- **N8N**: System message in "Call OpenAI API" node

## Cost Estimation

### OpenAI API Costs (GPT-4 Turbo)

- **Input**: ~$0.01 per 1K tokens
- **Output**: ~$0.03 per 1K tokens

### Estimated Costs

| Item | Cost |
|------|------|
| Per PDF (avg 20 pages) | $0.20 - $0.50 |
| All 22 PDFs | $4.40 - $11.00 |

💡 **Tip**: Start with 2-3 PDFs to test before processing all

## Troubleshooting

### Common Issues

#### "Rate Limit Exceeded"
✅ **Automatic handling** - Script waits 5 minutes and retries  
💡 **Prevention**: Increase `--delay` parameter

#### "PDF Not Found"
✅ Check file paths are correct  
💡 Use absolute paths if relative paths fail

#### "Invalid JSON Response"
✅ Check OpenAI API status  
💡 Try reducing `max_tokens` or using different model

#### "Out of Memory"
✅ Large PDFs may cause memory issues  
💡 Process in smaller batches or increase system memory

### Debug Mode

Enable detailed logging:

```python
# In python_pdf_processor.py, change logging level
logging.basicConfig(level=logging.DEBUG)
```

## Rate Limiting Best Practices

1. **Use delays**: Default 2s between requests
2. **Monitor usage**: Check OpenAI dashboard
3. **Batch smartly**: Don't process all PDFs at once if on free tier
4. **Upgrade tier**: Consider paid tier for faster processing

## Advanced Features

### Parallel Processing (Python)

⚠️ **Warning**: May hit rate limits faster

```python
# Modify python_pdf_processor.py to use ThreadPoolExecutor
from concurrent.futures import ThreadPoolExecutor

# In process_all_papers method
with ThreadPoolExecutor(max_workers=3) as executor:
    futures = [executor.submit(self._call_openai_api, pdf) for pdf in pdf_files]
```

### Database Integration

Add database storage instead of JSON files:

```python
# Add to python_pdf_processor.py
import sqlite3

def _save_to_database(self, annotations):
    conn = sqlite3.connect('annotations.db')
    # Insert logic here
```

### Webhook Notifications

Get notified when processing completes:

```python
# Add to python_pdf_processor.py
import requests

def _send_notification(self, message):
    requests.post('your-webhook-url', json={'message': message})
```

## Files Included

| File | Description |
|------|-------------|
| `python_pdf_processor.py` | Main Python script |
| `n8n_workflow_improved.json` | N8N workflow definition |
| `requirements.txt` | Python dependencies |
| `N8N_SETUP_GUIDE.md` | Detailed N8N setup |
| `.env.example` | Environment variables template |
| `README.md` | This file |

## Support

### Getting Help

1. Check `processing.log` for errors
2. Review N8N execution logs
3. Verify OpenAI API status
4. Check API usage limits

### Contributing

Improvements welcome! Consider:
- Better error handling
- Multi-language support
- UI for reviewing annotations
- Batch processing optimizations

## License

MIT License - Free to use and modify

## Acknowledgments

- OpenAI GPT-4 API for powerful annotation
- N8N for workflow automation platform
- GATE CS community for syllabus structure

---

**Version**: 1.0  
**Last Updated**: October 2025  
**Tested With**: OpenAI GPT-4 Turbo, Python 3.9+, N8N v1.0+

## What's Next?

After annotations are complete:

1. **Analyze Data** - Use the JSON files for insights
2. **Build Dashboard** - Visualize question distribution
3. **Create Study Guide** - Group by topics
4. **Train Models** - Use for ML/AI projects
5. **Share Data** - Help other GATE aspirants

---

Happy Annotating! 🎓📚

