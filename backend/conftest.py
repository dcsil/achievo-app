"""Shared pytest fixtures for backend API tests."""
import pytest
import sys
import os
import tempfile
from pathlib import Path
from dotenv import load_dotenv

# Ensure backend directory is in path for imports
backend_dir = str(Path(__file__).resolve().parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)


@pytest.fixture(scope="session", autouse=True)
def setup_test_env():
    """Load test environment variables before any tests run."""
    from dotenv import load_dotenv
    import os
    
    # Load .env.test file
    load_dotenv(".env.test")
    
    # Set TESTING flag so repositories know to skip pgsodium decryption
    os.environ["TESTING"] = "true"


@pytest.fixture
def app():
    """Create Flask test app instance with test configuration."""
    from app.main import app as flask_app
    flask_app.config['TESTING'] = True
    flask_app.config['UPLOAD_FOLDER'] = tempfile.mkdtemp()
    return flask_app


@pytest.fixture
def client(app):
    """Provide Flask test client."""
    return app.test_client()
