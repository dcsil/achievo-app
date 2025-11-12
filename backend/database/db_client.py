import os
from supabase import create_client, Client
from dotenv import load_dotenv


class DBClient:
    """Centralized Supabase SQL client factory and context helpers."""

    @staticmethod
    def connect():
        """Create and return a Supabase SQL connection using env vars and optional .env file.

        Requires env vars:
        - SUPABASE_URL
        - SUPABASE_KEY
        """
        load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")

        if not (supabase_url and supabase_key):
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_KEY must be set"
            )

        return create_client(supabase_url, supabase_key)
