import json
from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional
from datetime import timedelta
from oauth import (
    create_access_token,
    get_current_user,
    oauth2_scheme,
    Token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    hash_password,
    authenticate_user,
    decode_access_token,
)
from ws import ConnectionManager, MessageType
from fastapi.middleware.cors import CORSMiddleware

# App initialization
app = FastAPI()

manager = ConnectionManager()

# CORS setup
origins = ["http://localhost", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Mock database
fake_users_db = {
    # "testuser": {
    #     "username": "testuser",
    #     "display_name": "Test User",
    #     "email": "testuser@example.com",
    #     "hashed_password": "$2b$12$KIXQ1Y1JH6FJ1Y1JH6FJ1Y1JH6FJ1Y1JH6FJ1Y1JH6FJ1Y1JH6FJ1Y1",  # Example bcrypt hash
    #     "disabled": False,
    # }
}


def add_user_to_db(
    username: str,
    email: Optional[str],
    display_name: Optional[str],
    hashed_password: str,
):
    fake_users_db[username] = {
        "username": username,
        "email": email,
        "display_name": display_name,
        "hashed_password": hashed_password,
        "disabled": False,
    }
    with open("users.json", "w") as f:
        json.dump(fake_users_db, f)


def load_users_from_db():
    try:
        with open("users.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


fake_users_db = load_users_from_db()


# Pydantic models
class User(BaseModel):
    username: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    disabled: Optional[bool] = None


class UserInDB(User):
    hashed_password: str


# Endpoints
@app.post("/register")
def register_user(
    username: str,
    password: str,
    email: Optional[str] = None,
    display_name: Optional[str] = None,
):
    if username in fake_users_db:
        raise HTTPException(status_code=400, detail="Username already exists")
    hashed_password = hash_password(password)
    add_user_to_db(username, email, display_name, hashed_password)
    return {"message": "User registered successfully"}


@app.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(fake_users_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/users/me", response_model=User)
def read_users_me(current_user: User = Depends(get_current_user)):
    # we should return User BaseModal
    user = fake_users_db[current_user]
    return User(
        username=user.get("username"),
        email=user.get("email"),
        display_name=user.get("display_name"),
        disabled=user.get("disabled"),
    )


@app.get("/users/me/items")
def read_own_items(current_user: User = Depends(get_current_user)):
    return [{"item_id": "item1", "owner": current_user}]


@app.websocket("/pyre")
async def websocket_endpoint(websocket: WebSocket, token: str = None):
    channel = "pyre"
    await websocket.accept()

    # Authenticate user manually using the token
    if token:
        try:
            payload = decode_access_token(
                token
            )  # Decode the token instead of creating a new one
            username = payload.get("sub")
            if username is None or username not in fake_users_db:
                raise HTTPException(status_code=401, detail="Invalid token")
        except Exception:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    else:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    manager.connect(channel, websocket)
    try:
        # Notify other users that a new user has joined
        await manager.broadcast(
            channel, username, f"{username} Joined the chat!", MessageType.USER_JOINED
        )
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(channel, username, data, MessageType.MESSAGE)
    except WebSocketDisconnect:
        manager.disconnect(channel, websocket)
        await manager.broadcast(
            channel, username, f"{username} Left the chat!", MessageType.USER_LEFT
        )
    except Exception as e:
        await manager.broadcast(channel, str(e), MessageType.ERROR)
        raise HTTPException(status_code=500, detail="Internal Server Error")
