# E-Learning Platform Backend

This is the backend service for the E-Learning Platform built with Flask.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
- Windows:
```bash
venv\Scripts\activate
```
- Unix or MacOS:
```bash
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the application:
```bash
python app.py
```

The server will start at `http://localhost:5000`

## Project Structure

- `app.py`: Main application file
- `config.py`: Configuration settings
- `requirements.txt`: Project dependencies

## API Endpoints

- `GET /`: Health check endpoint

## Development

1. Install development dependencies:
```bash
pip install black pylint pytest
```

2. Format code:
```bash
black .
```

3. Run linter:
```bash
pylint **/*.py
```

4. Run tests:
```bash
pytest
``` 