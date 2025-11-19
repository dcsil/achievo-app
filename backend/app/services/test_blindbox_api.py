"""Pytest tests for blind box API endpoints."""
import pytest
import uuid


def test_create_blind_box_series(client, monkeypatch):
    """Test POST /db/blind-box-series - create series."""
    created = []
    
    class StubBlindBoxSeriesRepo:
        def create(self, **kwargs):
            created.append(kwargs)
            return True
    
    import app.main as main
    monkeypatch.setattr(main, "BlindBoxSeriesRepository", StubBlindBoxSeriesRepo)
    
    payload = {
        "series_id": "s1",
        "name": "Series 1",
        "description": "Test series",
        "cost_points": 100,
        "release_date": "2025-11-01"
    }
    
    resp = client.post("/db/blind-box-series", json=payload)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["status"] == "created"
    assert data["series_id"] == "s1"


def test_create_blind_box_series_missing_fields(client):
    """Test POST /db/blind-box-series - missing required fields."""
    payload = {"series_id": "s1"}  # Missing name
    
    resp = client.post("/db/blind-box-series", json=payload)
    assert resp.status_code == 400
    assert "name" in resp.get_json()["error"]


def test_delete_blind_box_series(client, monkeypatch):
    """Test DELETE /db/blind-box-series/<series_id>."""
    class StubBlindBoxSeriesRepo:
        def delete(self, series_id):
            return series_id == "s1"
    
    import app.main as main
    monkeypatch.setattr(main, "BlindBoxSeriesRepository", StubBlindBoxSeriesRepo)
    
    resp = client.delete("/db/blind-box-series/s1")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "deleted"


def test_create_blind_box_figure(client, monkeypatch):
    """Test POST /db/blind-box-figures - create figure."""
    created = []
    
    class StubBlindBoxFiguresRepo:
        def create(self, **kwargs):
            created.append(kwargs)
            return True
    
    import app.main as main
    monkeypatch.setattr(main, "BlindBoxFiguresRepository", StubBlindBoxFiguresRepo)
    
    payload = {
        "figure_id": "f1",
        "series_id": "s1",
        "name": "Figure 1",
        "rarity": "common",
        "weight": 0.5
    }
    
    resp = client.post("/db/blind-box-figures", json=payload)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["status"] == "created"
    assert data["figure_id"] == "f1"


def test_delete_blind_box_figure(client, monkeypatch):
    """Test DELETE /db/blind-box-figures/<figure_id>."""
    class StubBlindBoxFiguresRepo:
        def delete(self, figure_id):
            return figure_id == "f1"
    
    import app.main as main
    monkeypatch.setattr(main, "BlindBoxFiguresRepository", StubBlindBoxFiguresRepo)
    
    resp = client.delete("/db/blind-box-figures/f1")
    assert resp.status_code == 200


def test_purchase_blind_box_missing_user(client):
    """Test POST /db/blind-boxes/purchase - missing user_id."""
    resp = client.post("/db/blind-boxes/purchase", json={})
    assert resp.status_code == 400
    assert "user_id" in resp.get_json()["error"]


def test_purchase_blind_box_user_not_found(client, monkeypatch):
    """Test POST /db/blind-boxes/purchase - user not found."""
    class StubUsersRepo:
        def fetch_by_id(self, user_id):
            return None
    
    import app.main as main
    monkeypatch.setattr(main, "UsersRepository", StubUsersRepo)
    
    resp = client.post("/db/blind-boxes/purchase", json={"user_id": "nonexistent"})
    assert resp.status_code == 404


def test_purchase_blind_box_insufficient_points(client, monkeypatch):
    """Test POST /db/blind-boxes/purchase - insufficient points."""
    class StubUsersRepo:
        def fetch_by_id(self, user_id):
            return {"user_id": user_id, "total_points": 10}
    
    class StubBlindBoxSeriesRepo:
        def fetch_by_id(self, series_id):
            return {"series_id": series_id, "cost_points": 100}
    
    import app.main as main
    monkeypatch.setattr(main, "UsersRepository", StubUsersRepo)
    monkeypatch.setattr(main, "BlindBoxSeriesRepository", StubBlindBoxSeriesRepo)
    
    resp = client.post("/db/blind-boxes/purchase", json={"user_id": "u1", "series_id": "s1"})
    assert resp.status_code == 400
    assert "Insufficient" in resp.get_json()["error"]


def test_purchase_blind_box_success(client, monkeypatch):
    """Test POST /db/blind-boxes/purchase - successful purchase."""
    class StubUsersRepo:
        def fetch_by_id(self, user_id):
            if hasattr(self, '_updated'):
                return {"user_id": user_id, "total_points": 400}
            return {"user_id": user_id, "total_points": 500}
        def update_points(self, user_id, delta):
            self._updated = True
            return True
    
    class StubBlindBoxSeriesRepo:
        def fetch_by_id(self, series_id):
            return {"series_id": series_id, "name": "Series 1", "cost_points": 100}
    
    class StubBlindBoxFiguresRepo:
        def select_random_figure(self, series_id):
            return {"figure_id": "f1", "name": "Figure 1", "rarity": "common"}
    
    class StubUserBlindBoxesRepo:
        def create(self, **kwargs):
            return True
    
    import app.main as main
    monkeypatch.setattr(main, "UsersRepository", StubUsersRepo)
    monkeypatch.setattr(main, "BlindBoxSeriesRepository", StubBlindBoxSeriesRepo)
    monkeypatch.setattr(main, "BlindBoxFiguresRepository", StubBlindBoxFiguresRepo)
    monkeypatch.setattr(main, "UserBlindBoxesRepository", StubUserBlindBoxesRepo)
    
    resp = client.post("/db/blind-boxes/purchase", json={"user_id": "u1", "series_id": "s1"})
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["status"] == "purchased"
    assert "awarded_figure" in data
    assert data["remaining_points"] == 400


def test_get_blind_box_series(client, monkeypatch):
    """Test GET /db/blind-box-series - list all series."""
    series = [
        {"series_id": "s1", "name": "Series 1", "cost_points": 100},
        {"series_id": "s2", "name": "Series 2", "cost_points": 200},
    ]
    
    class StubBlindBoxSeriesRepo:
        def fetch_all(self):
            return series
    
    import app.main as main
    monkeypatch.setattr(main, "BlindBoxSeriesRepository", StubBlindBoxSeriesRepo)
    
    resp = client.get("/db/blind-box-series")
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data) == 2


def test_get_affordable_series(client, monkeypatch):
    """Test GET /db/blind-box-series/affordable."""
    class StubUsersRepo:
        def fetch_by_id(self, user_id):
            return {"user_id": user_id, "total_points": 150}
    
    class StubBlindBoxSeriesRepo:
        def fetch_affordable_series(self, points):
            return [{"series_id": "s1", "cost_points": 100}]
    
    import app.main as main
    monkeypatch.setattr(main, "UsersRepository", StubUsersRepo)
    monkeypatch.setattr(main, "BlindBoxSeriesRepository", StubBlindBoxSeriesRepo)
    
    resp = client.get("/db/blind-box-series/affordable?user_id=u1")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["user_points"] == 150
    assert len(data["affordable_series"]) == 1


def test_get_user_figures(client, monkeypatch):
    """Test GET /db/users/<user_id>/figures."""
    figures = [
        {"figure_id": "f1", "figure_name": "Figure 1", "figure_rarity": "common", "series_id": "s1"},
        {"figure_id": "f2", "figure_name": "Figure 2", "figure_rarity": "rare", "series_id": "s1"},
    ]
    
    class StubUserBlindBoxesRepo:
        def fetch_by_user(self, user_id):
            return figures
    
    import app.main as main
    monkeypatch.setattr(main, "UserBlindBoxesRepository", StubUserBlindBoxesRepo)
    
    resp = client.get("/db/users/u1/figures")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["total"] == 2
    assert len(data["results"]) == 2


def test_delete_user_blind_box(client, monkeypatch):
    """Test DELETE /db/user-blind-boxes/<purchase_id>."""
    class StubUserBlindBoxesRepo:
        def delete(self, purchase_id):
            return purchase_id == "p1"
    
    import app.main as main
    monkeypatch.setattr(main, "UserBlindBoxesRepository", StubUserBlindBoxesRepo)
    
    resp = client.delete("/db/user-blind-boxes/p1")
    assert resp.status_code == 200
    assert resp.get_json()["status"] == "deleted"
