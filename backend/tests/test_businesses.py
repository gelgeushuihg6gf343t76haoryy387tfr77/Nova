class TestBusinesses:
    def test_create(self, client, auth_headers):
        resp = client.post("/businesses", json={"name": "My Business", "country_code": "US", "currency_code": "USD"}, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "My Business"
        assert "id" in data

    def test_list(self, client, auth_headers):
        client.post("/businesses", json={"name": "Biz A", "country_code": "US", "currency_code": "USD"}, headers=auth_headers)
        client.post("/businesses", json={"name": "Biz B", "country_code": "GB", "currency_code": "GBP"}, headers=auth_headers)
        resp = client.get("/businesses", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2

    def test_list_requires_auth(self, client):
        resp = client.get("/businesses")
        assert resp.status_code == 401

    def test_delete(self, client, auth_headers, business_id):
        resp = client.delete(f"/businesses/{business_id}", headers=auth_headers)
        assert resp.status_code == 200

    def test_delete_other_users_business(self, client, auth_headers, business_id):
        client2_resp = client.post("/auth/register", json={"email": "other@example.com", "password": "secret123"})
        other_id = client2_resp.json()["id"]
        other_token_resp = client.post("/auth/login", json={"identifier": "other@example.com", "password": "secret123"})
        other_token = other_token_resp.json()["access_token"]
        resp = client.delete(f"/businesses/{business_id}", headers={"Authorization": f"Bearer {other_token}"})
        assert resp.status_code == 404

    def test_create_without_country_code(self, client, auth_headers):
        resp = client.post("/businesses", json={"name": "No CC", "country_code": "", "currency_code": "USD"}, headers=auth_headers)
        assert resp.status_code == 200
