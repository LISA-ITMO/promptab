"""
Unit tests for authentication and security
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch
from fastapi import status
from httpx import AsyncClient
from jose import jwt

from app.core.security import (
    create_access_token,
    verify_password,
    get_password_hash,
    ALGORITHM,
    SECRET_KEY
)
from app.core.config import settings
from app.models.user import User


class TestAuthentication:
    """Test cases for authentication functionality."""

    @pytest.mark.asyncio
    async def test_register_success(self, async_client: AsyncClient):
        """Test successful user registration."""
        # Arrange
        user_data = {
            "email": "newuser@example.com",
            "password": "securepassword123",
            "full_name": "New User"
        }

        # Act
        response = await async_client.post("/api/v1/auth/register", json=user_data)

        # Assert
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["full_name"] == "New User"
        assert "id" in data
        assert "password" not in data

    @pytest.mark.asyncio
    async def test_register_existing_email(self, async_client: AsyncClient, test_user: User):
        """Test registration with existing email."""
        # Arrange
        user_data = {
            "email": test_user.email,
            "password": "securepassword123",
            "full_name": "Test User"
        }

        # Act
        response = await async_client.post("/api/v1/auth/register", json=user_data)

        # Assert
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "email already registered" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_register_invalid_email(self, async_client: AsyncClient):
        """Test registration with invalid email."""
        # Arrange
        user_data = {
            "email": "invalid-email",
            "password": "securepassword123",
            "full_name": "Test User"
        }

        # Act
        response = await async_client.post("/api/v1/auth/register", json=user_data)

        # Assert
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.asyncio
    async def test_register_weak_password(self, async_client: AsyncClient):
        """Test registration with weak password."""
        # Arrange
        user_data = {
            "email": "test@example.com",
            "password": "123",
            "full_name": "Test User"
        }

        # Act
        response = await async_client.post("/api/v1/auth/register", json=user_data)

        # Assert
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.asyncio
    async def test_login_success(self, async_client: AsyncClient, test_user: User):
        """Test successful user login."""
        # Arrange
        login_data = {
            "username": test_user.email,
            "password": "testpassword"  # Assuming this is the password used in fixture
        }

        # Act
        response = await async_client.post("/api/v1/auth/login", data=login_data)

        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["email"] == test_user.email

    @pytest.mark.asyncio
    async def test_login_invalid_credentials(self, async_client: AsyncClient):
        """Test login with invalid credentials."""
        # Arrange
        login_data = {
            "username": "nonexistent@example.com",
            "password": "wrongpassword"
        }

        # Act
        response = await async_client.post("/api/v1/auth/login", data=login_data)

        # Assert
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "incorrect email or password" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_login_inactive_user(self, async_client: AsyncClient, db_session):
        """Test login with inactive user."""
        # Arrange
        inactive_user = User(
            email="inactive@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=False
        )
        db_session.add(inactive_user)
        await db_session.commit()

        login_data = {
            "username": "inactive@example.com",
            "password": "password123"
        }

        # Act
        response = await async_client.post("/api/v1/auth/login", data=login_data)

        # Assert
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "inactive" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_get_current_user_success(
        self, 
        async_client: AsyncClient, 
        test_user: User, 
        test_user_token: str
    ):
        """Test successful current user retrieval."""
        # Act
        response = await async_client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == test_user.email
        assert data["id"] == str(test_user.id)

    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token(self, async_client: AsyncClient):
        """Test current user retrieval with invalid token."""
        # Act
        response = await async_client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )

        # Assert
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_get_current_user_no_token(self, async_client: AsyncClient):
        """Test current user retrieval without token."""
        # Act
        response = await async_client.get("/api/v1/auth/me")

        # Assert
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_refresh_token_success(
        self, 
        async_client: AsyncClient, 
        test_user: User, 
        test_user_token: str
    ):
        """Test successful token refresh."""
        # Act
        response = await async_client.post(
            "/api/v1/auth/refresh",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_logout_success(
        self, 
        async_client: AsyncClient, 
        test_user_token: str
    ):
        """Test successful logout."""
        # Act
        response = await async_client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["message"] == "Successfully logged out"

    @pytest.mark.asyncio
    async def test_change_password_success(
        self, 
        async_client: AsyncClient, 
        test_user: User, 
        test_user_token: str
    ):
        """Test successful password change."""
        # Arrange
        password_data = {
            "current_password": "testpassword",
            "new_password": "newsecurepassword123"
        }

        # Act
        response = await async_client.put(
            "/api/v1/auth/change-password",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json=password_data
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["message"] == "Password changed successfully"

    @pytest.mark.asyncio
    async def test_change_password_wrong_current(
        self, 
        async_client: AsyncClient, 
        test_user_token: str
    ):
        """Test password change with wrong current password."""
        # Arrange
        password_data = {
            "current_password": "wrongpassword",
            "new_password": "newsecurepassword123"
        }

        # Act
        response = await async_client.put(
            "/api/v1/auth/change-password",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json=password_data
        )

        # Assert
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "incorrect password" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_forgot_password_success(self, async_client: AsyncClient, test_user: User):
        """Test successful forgot password request."""
        # Arrange
        with patch('app.api.v1.endpoints.auth.send_reset_email') as mock_send_email:
            mock_send_email.return_value = None

            # Act
            response = await async_client.post(
                "/api/v1/auth/forgot-password",
                json={"email": test_user.email}
            )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert "reset email sent" in response.json()["message"].lower()

    @pytest.mark.asyncio
    async def test_forgot_password_nonexistent_email(self, async_client: AsyncClient):
        """Test forgot password with nonexistent email."""
        # Act
        response = await async_client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "nonexistent@example.com"}
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK  # Should not reveal if email exists

    @pytest.mark.asyncio
    async def test_reset_password_success(self, async_client: AsyncClient, test_user: User):
        """Test successful password reset."""
        # Arrange
        reset_token = create_access_token(
            data={"sub": str(test_user.id), "type": "password_reset"},
            expires_delta=timedelta(hours=1)
        )
        
        reset_data = {
            "token": reset_token,
            "new_password": "newsecurepassword123"
        }

        # Act
        response = await async_client.post(
            "/api/v1/auth/reset-password",
            json=reset_data
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert "password reset successfully" in response.json()["message"].lower()

    @pytest.mark.asyncio
    async def test_reset_password_invalid_token(self, async_client: AsyncClient):
        """Test password reset with invalid token."""
        # Arrange
        reset_data = {
            "token": "invalid_token",
            "new_password": "newsecurepassword123"
        }

        # Act
        response = await async_client.post(
            "/api/v1/auth/reset-password",
            json=reset_data
        )

        # Assert
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.asyncio
    async def test_verify_email_success(self, async_client: AsyncClient, db_session):
        """Test successful email verification."""
        # Arrange
        unverified_user = User(
            email="unverified@example.com",
            hashed_password=get_password_hash("password123"),
            is_verified=False
        )
        db_session.add(unverified_user)
        await db_session.commit()

        verify_token = create_access_token(
            data={"sub": str(unverified_user.id), "type": "email_verification"},
            expires_delta=timedelta(hours=24)
        )

        # Act
        response = await async_client.post(
            "/api/v1/auth/verify-email",
            json={"token": verify_token}
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert "email verified" in response.json()["message"].lower()

        # Verify user is now verified
        await db_session.refresh(unverified_user)
        assert unverified_user.is_verified is True


class TestSecurity:
    """Test cases for security utilities."""

    def test_create_access_token(self):
        """Test access token creation."""
        # Arrange
        data = {"sub": "test_user_id"}

        # Act
        token = create_access_token(data=data)

        # Assert
        assert isinstance(token, str)
        assert len(token) > 0

        # Verify token can be decoded
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "test_user_id"

    def test_create_access_token_with_expiry(self):
        """Test access token creation with custom expiry."""
        # Arrange
        data = {"sub": "test_user_id"}
        expires_delta = timedelta(minutes=30)

        # Act
        token = create_access_token(data=data, expires_delta=expires_delta)

        # Assert
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "test_user_id"
        
        # Check expiry time
        exp_time = datetime.fromtimestamp(payload["exp"])
        now = datetime.utcnow()
        assert exp_time > now
        assert exp_time <= now + timedelta(minutes=31)

    def test_verify_password(self):
        """Test password verification."""
        # Arrange
        password = "testpassword"
        hashed = get_password_hash(password)

        # Act & Assert
        assert verify_password(password, hashed) is True
        assert verify_password("wrongpassword", hashed) is False

    def test_get_password_hash(self):
        """Test password hashing."""
        # Arrange
        password = "testpassword"

        # Act
        hashed = get_password_hash(password)

        # Assert
        assert isinstance(hashed, str)
        assert hashed != password
        assert len(hashed) > len(password)

    def test_password_hash_uniqueness(self):
        """Test that password hashes are unique."""
        # Arrange
        password = "testpassword"

        # Act
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        # Assert
        assert hash1 != hash2  # Should be different due to salt

    def test_token_expiry(self):
        """Test token expiry functionality."""
        # Arrange
        data = {"sub": "test_user_id"}
        expires_delta = timedelta(seconds=1)  # Very short expiry

        # Act
        token = create_access_token(data=data, expires_delta=expires_delta)

        # Assert
        import time
        time.sleep(2)  # Wait for token to expire

        # Should raise exception for expired token
        with pytest.raises(jwt.ExpiredSignatureError):
            jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

    def test_token_invalid_signature(self):
        """Test token with invalid signature."""
        # Arrange
        data = {"sub": "test_user_id"}
        token = create_access_token(data=data)

        # Act & Assert
        with pytest.raises(jwt.JWTError):
            jwt.decode(token, "wrong_secret_key", algorithms=[ALGORITHM])


class TestRateLimiting:
    """Test cases for rate limiting functionality."""

    @pytest.mark.asyncio
    async def test_login_rate_limiting(self, async_client: AsyncClient):
        """Test rate limiting on login endpoint."""
        # Arrange
        login_data = {
            "username": "test@example.com",
            "password": "wrongpassword"
        }

        # Act - Make multiple requests
        responses = []
        for _ in range(6):  # Assuming limit is 5 requests per minute
            response = await async_client.post("/api/v1/auth/login", data=login_data)
            responses.append(response)

        # Assert
        # First 5 should be 401 (wrong credentials)
        for i in range(5):
            assert responses[i].status_code == status.HTTP_401_UNAUTHORIZED

        # 6th should be rate limited
        assert responses[5].status_code == status.HTTP_429_TOO_MANY_REQUESTS

    @pytest.mark.asyncio
    async def test_register_rate_limiting(self, async_client: AsyncClient):
        """Test rate limiting on register endpoint."""
        # Arrange
        user_data = {
            "email": "test@example.com",
            "password": "securepassword123",
            "full_name": "Test User"
        }

        # Act - Make multiple requests
        responses = []
        for i in range(6):  # Assuming limit is 5 requests per minute
            user_data["email"] = f"test{i}@example.com"
            response = await async_client.post("/api/v1/auth/register", json=user_data)
            responses.append(response)

        # Assert
        # First 5 should be 201 (successful registration)
        for i in range(5):
            assert responses[i].status_code == status.HTTP_201_CREATED

        # 6th should be rate limited
        assert responses[5].status_code == status.HTTP_429_TOO_MANY_REQUESTS 