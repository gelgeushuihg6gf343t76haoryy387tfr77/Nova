class TestIncome:
    def _headers(self, auth_headers, business_id):
        return {**auth_headers, "X-Business-Id": business_id}

    def test_create(self, client, auth_headers, business_id):
        headers = self._headers(auth_headers, business_id)
        resp = client.post("/income", json={
            "amount_cents": 5000, "occurred_on": "2025-01-15", "source": "Client A"
        }, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["amount_cents"] == 5000
        assert data["source"] == "Client A"

    def test_list(self, client, auth_headers, business_id):
        headers = self._headers(auth_headers, business_id)
        client.post("/income", json={"amount_cents": 1000, "occurred_on": "2025-02-01"}, headers=headers)
        client.post("/income", json={"amount_cents": 2000, "occurred_on": "2025-02-15"}, headers=headers)
        resp = client.get("/income", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2

    def test_list_requires_auth(self, client, business_id):
        headers = {"X-Business-Id": business_id}
        resp = client.get("/income", headers=headers)
        assert resp.status_code == 401

    def test_create_negative_amount(self, client, auth_headers, business_id):
        headers = self._headers(auth_headers, business_id)
        resp = client.post("/income", json={"amount_cents": -100, "occurred_on": "2025-03-01"}, headers=headers)
        assert resp.status_code == 422

    def test_delete(self, client, auth_headers, business_id):
        headers = self._headers(auth_headers, business_id)
        create_resp = client.post("/income", json={"amount_cents": 3000, "occurred_on": "2025-04-01"}, headers=headers)
        income_id = create_resp.json()["id"]
        resp = client.delete(f"/income/{income_id}", headers=headers)
        assert resp.status_code == 200
