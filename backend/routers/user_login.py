import os
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from database import get_db
from models import User_Login
from pydantic import BaseModel
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
from jose import jwt, JWTError

# Load environment variables
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

router = APIRouter(tags=["User Login"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ✅ Pydantic Models
class UserUpdateRequest(BaseModel):
    name: str | None = None
    new_password: str | None = None

class SecurityAnswerRequest(BaseModel):
    email: str
    security_answer: str

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserSignupRequest(BaseModel):
    name: str
    email: str
    password: str
    security_question: str
    security_answer: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User_Login:
    credentials_exception = HTTPException(status_code=401, detail="Invalid token")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("email")
        if not email:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User_Login).filter(User_Login.email == email).first()
    if not user:
        raise credentials_exception

    return user  # ✅ Now returns a `User_Login` object instead of just the email

@router.get("/{user_id}/", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db), current_user: User_Login = Depends(get_current_user)):
    # ✅ Ensure user can only fetch their own data
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Permission denied")

    return {"id": current_user.id, "name": current_user.name, "email": current_user.email}


# ✅ User Registration
@router.post("/register/")
def register_user(request: UserSignupRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User_Login).filter(User_Login.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered")

    hashed_password = pwd_context.hash(request.password)
    new_user = User_Login(
        name=request.name,
        email=request.email,
        password=hashed_password,
        security_question=request.security_question,
        security_answer=request.security_answer.lower(),
    )
    db.add(new_user)
    db.commit()
    return {"message": "User registered successfully"}

# ✅ User Login (Returns JWT Token)
@router.post("/login/")
def login_user(request: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User_Login).filter(User_Login.email == request.email).first()
    if not user or not pwd_context.verify(request.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = jwt.encode({"email": user.email}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": access_token, "user_id": user.id, "user_email":user.email, "user_name":user.name}

# ✅ Fetch Security Question
@router.get("/reset-password/question/")
def get_security_question(email: str, db: Session = Depends(get_db)):
    user = db.query(User_Login).filter(User_Login.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"security_question": user.security_question}

# ✅ Verify Security Answer
@router.post("/reset-password/verify/")
def verify_security_answer(request: SecurityAnswerRequest, db: Session = Depends(get_db)):
    user = db.query(User_Login).filter(User_Login.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.security_answer.lower() != request.security_answer.lower():
        raise HTTPException(status_code=401, detail="Incorrect security answer")

    return {"message": "Security answer verified, proceed to reset password"}

# ✅ Update User Info (Handles Name & Password)
@router.post("/update/{user_id}/")
def update_user(user_id: int, request: UserUpdateRequest, db: Session = Depends(get_db), current_user: User_Login = Depends(get_current_user)):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Permission denied")

    if request.name:
        current_user.name = request.name  # ✅ Update name

    if request.new_password:
        current_user.password = pwd_context.hash(request.new_password)  # ✅ Update password

    db.commit()
    return {"message": "User information updated successfully"}
