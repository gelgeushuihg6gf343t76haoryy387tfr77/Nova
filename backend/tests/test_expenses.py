class TestExpenses:
    def _headers(self, auth_headers, business_id):
        return {**auth_headers, "X-Business-Id": business_id}

    def test_create(self, client, auth_headers, business_id):
        headers = self._headers(auth_headers, business_id)
        resp = client.post("/expenses", json={
            "amount_cents": 2500, "occurred_on": "2025-01-10", "vendor": "Office Supplies Co"
        }, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["amount_cents"] == 2500
        assert data["vendor"] == "Office Supplies Co"

    def test_list(self, client, auth_headers, business_id):
        headers = self._headers(auth_headers, business_id)
        client.post("/expenses", json={"amount_cents": 1500, "occurred_on": "2025-02-01"}, headers=headers)
        client.post("/expenses", json={"amount_cents": 3500, "occurred_on": "2025-02-10"}, headers=headers)
        resp = client.get("/expenses", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2

    def test_list_requires_auth(self, client, business_id):
        headers = {"X-Business-Id": business_id}
        resp = client.get("/expenses", headers=headers)
        assert resp.status_code == 401

    def test_create_with_category(self, client, auth_headers, business_id):
        headers = self._headers(auth_headers, business_id)
        cat_resp = client.post("/categories", json={
            "kind": "expense", "name": "Software"
        }, headers=headers)
        assert cat_resp.status_code == 200, cat_resp.text
        cat_id = cat_resp.json()["id"]
        resp = client.post("/expenses", json={
            "amount_cents": 9900, "occurred_on": "2025-03-15",
            "category_id": cat_id, "vendor": "SaaS Provider"
        }, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["category_id"] == cat_id

    def test_delete(self, client, auth_headers, business_id):
        headers = self._headers(auth_headers, business_id)
        create_resp = client.post("/expenses", json={"amount_cents": 5000, "occurred_on": "2025-04-01"}, headers=headers)
        expense_id = create_resp.json()["id"]
        resp = client.delete(f"/expenses/{expense_id}", headers=headers)
        assert resp.status_code == 200
