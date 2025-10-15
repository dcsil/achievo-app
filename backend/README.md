
## Backend Setup

### 1. Install dependencies

```
cd src/backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment variables

Copy .env.example → .env and add your Gemini API key:

```
GEMINI_API_KEY=your_api_key_here
```

### 3. Run the backend

```
cd src/backend
python -m app.main
```

This starts a Flask server on http://127.0.0.1:5000.


### 4. Test locally

	•	Place a sample syllabus.pdf in src/backend/app/storage/uploads/.
	•	Use curl or Postman:

```
curl -X POST http://127.0.0.1:5000/upload \
  -F "file=@syllabus.pdf"
```

You should see Gemini return extracted tasks/events in Json format.

### 5. Run unit tests

Unit tests are written using [pytest](https://docs.pytest.org/). To run all backend unit tests:

1. Install test dependencies (if not already):

```
pip install pytest flask werkzeug
```

2. From the backend directory, run:

```
pytest app/utils/test_file_utils.py
```

Or, from the project root:

```
pytest backend/app/utils/test_file_utils.py
```

All tests should pass. You can add more tests in the `app/utils/` directory as needed.