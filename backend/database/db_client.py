import os
from databricks import sql
from dotenv import load_dotenv


class DBClient:
    """Centralized Databricks SQL client factory and context helpers."""

    @staticmethod
    def connect():
        """Create and return a Databricks SQL connection using env vars and optional .env file.

        Requires env vars:
        - DATABRICKS_SERVER_HOSTNAME
        - DATABRICKS_HTTP_PATH
        - DATABRICKS_TOKEN
        """
        load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

        server_hostname = os.getenv("DATABRICKS_SERVER_HOSTNAME")
        http_path = os.getenv("DATABRICKS_HTTP_PATH")
        token = os.getenv("DATABRICKS_TOKEN")

        if not (server_hostname and http_path and token):
            raise RuntimeError(
                "DATABRICKS_SERVER_HOSTNAME, DATABRICKS_HTTP_PATH and DATABRICKS_TOKEN must be set"
            )

        return sql.connect(
            server_hostname=server_hostname,
            http_path=http_path,
            access_token=token,
            _tls_no_verify=True,
        )
