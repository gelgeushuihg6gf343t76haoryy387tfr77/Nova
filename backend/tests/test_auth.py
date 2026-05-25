from app.core.security import hash_password, verify_password, create_access_token, decode_token


class TestPasswordHashing:
    def test_hash_and_verify(self):
        pw = "MySecurePass1!"
        hashed = hash_password(pw)
        assert hashed != pw
        assert verify_password(pw, hashed) is True
        assert verify_password("wrong", hashed) is False

    def test_unique_hashes(self):
        h1 = hash_password("password123")
        h2 = hash_password("password123")
        assert h1 != h2


class TestJWT:
    def test_create_and_decode(self):
        token = create_access_token("user-123")
        payload = decode_token(token)
        assert payload["sub"] == "user-123"
        assert "exp" in payload

    def test_invalid_token(self):
        import pytest
        with pytest.raises(ValueError, match="Invalid token"):
            decode_token("not.a.token")


class TestRegister:
    def test_register_success(self, client):
        resp = client.post("/auth/register", json={"email": "new@example.com", "password": "secure123", "full_name": "New User"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "new@example.com"
        assert data["full_name"] == "New User"
        assert "id" in data

    def test_register_duplicate_email(self, client):
        client.post("/auth/register", json={"email": "dup@example.com", "password": "secure123"})
        resp = client.post("/auth/register", json={"email": "dup@example.com", "password": "other456"})
        assert resp.status_code == 400
        assert "already registered" in resp.json()["detail"].lower()

    def test_register_invalid_email(self, client):
        resp = client.post("/auth/register", json={"email": "not-an-email", "password": "secure123"})
        assert resp.status_code == 422


class TestLogin:
    def test_login_success(self, client, db_session):
        from app.models import User
        from sqlalchemy import select
        client.post("/auth/register", json={"email": "login@example.com", "password": "rightpass"})
        user = db_session.scalar(select(User).where(User.email == "login@example.com"))
        user.is_verified = True
        db_session.commit()
        resp = client.post("/auth/login", json={"identifier": "login@example.com", "password": "rightpass"})
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client):
        client.post("/auth/register", json={"email": "wrongpw@example.com", "password": "correct"})
        resp = client.post("/auth/login", json={"identifier": "wrongpw@example.com", "password": "wrong"})
        assert resp.status_code == 401
        assert "invalid" in resp.json()["detail"].lower()

    def test_login_nonexistent(self, client):
        resp = client.post("/auth/login", json={"identifier": "nobody@example.com", "password": "anything"})
        assert resp.status_code == 401


class TestMe:
    def test_me_authenticated(self, client, test_user, auth_headers):
        resp = client.get("/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == test_user.email
        assert data["email"] == "test@example.com"

    def test_me_unauthenticated(self, client):
        resp = client.get("/auth/me")
        assert resp.status_code == 401


class TestResetCode:
    def test_send_code_unknown_email(self, client):
        resp = client.post("/auth/send-reset-code", json={"email": "unknown@example.com"})
        assert resp.status_code == 200
        assert "email" in resp.json()["message"].lower()

    def test_send_code_and_reset(self, client, test_user):
        resp = client.post("/auth/send-reset-code", json={"email": test_user.email})
        assert resp.status_code == 200
        msg = resp.json()["message"]
        assert "DEV MODE" in msg
        code = msg.split(": ")[-1].strip()

        resp2 = client.post("/auth/reset-with-code", json={"code": code, "email": test_user.email, "password": "codePass789"})
        assert resp2.status_code == 200
        assert resp2.json()["success"] is True

        resp3 = client.post("/auth/login", json={"identifier": test_user.email, "password": "codePass789"})
        assert resp3.status_code == 200

    def test_reset_with_wrong_code(self, client, test_user):
        resp = client.post("/auth/reset-with-code", json={"code": "999999", "email": test_user.email, "password": "whatever"})
        assert resp.status_code == 200
        assert resp.json()["success"] is False

    def test_reset_with_wrong_email(self, client, test_user):
        client.post("/auth/send-reset-code", json={"email": test_user.email})
        resp = client.post("/auth/reset-with-code", json={"code": "000000", "email": "wrong@example.com", "password": "whatever"})
        assert resp.status_code == 200
        assert resp.json()["success"] is False


class TestForgotAndResetPassword:
    def test_forgot_password_unknown_email(self, client):
        resp = client.post("/auth/forgot-password", json={"email": "unknown@example.com"})
        assert resp.status_code == 200
        assert "email" in resp.json()["message"].lower()

    def test_forgot_and_reset_flow(self, client, test_user):
        resp = client.post("/auth/forgot-password", json={"email": test_user.email})
        assert resp.status_code == 200
        msg = resp.json()["message"]
        assert "DEV MODE" in msg
        token = msg.split("?token=")[-1].strip()

        resp2 = client.post("/auth/reset-password", json={"token": token, "password": "newpass456"})
        assert resp2.status_code == 200
        assert resp2.json()["success"] is True

        resp3 = client.post("/auth/login", json={"identifier": test_user.email, "password": "newpass456"})
        assert resp3.status_code == 200

    def test_reset_password_invalid_token(self, client):
        resp = client.post("/auth/reset-password", json={"token": "bogus-token", "password": "newpass456"})
        assert resp.status_code == 200
        assert resp.json()["success"] is False
