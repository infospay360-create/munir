from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from bson import ObjectId
import secrets
import random
import uuid
import base64
from collections import deque

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Setup uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, mobile: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "mobile": mobile,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        user.pop("pin_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def generate_referral_code() -> str:
    return secrets.token_urlsafe(6).upper()[:8]

def generate_otp() -> str:
    otp = str(random.randint(100000, 999999))
    print(f"\n🔐 OTP Generated: {otp}\n")
    return otp

class RegisterRequest(BaseModel):
    name: str
    mobile: str
    password: str
    referral_code: Optional[str] = None

class LoginRequest(BaseModel):
    mobile: str
    password: str

class SetupPINRequest(BaseModel):
    pin: str

class VerifyPINRequest(BaseModel):
    pin: str

class SendOTPRequest(BaseModel):
    mobile: str

class VerifyOTPRequest(BaseModel):
    mobile: str
    otp: str

class ResetPasswordRequest(BaseModel):
    mobile: str
    otp: str
    new_password: str

class ResetPINRequest(BaseModel):
    mobile: str
    otp: str
    new_pin: str

class SelfTransferRequest(BaseModel):
    amount: float
    pin: str

class UserTransferRequest(BaseModel):
    receiver_mobile: str
    amount: float
    pin: str

class AddFundRequest(BaseModel):
    amount: float

class RechargeRequest(BaseModel):
    recharge_type: str
    number: str
    operator: str
    amount: float
    payment_mode: str

class CoinPackageRequest(BaseModel):
    amount: float
    coins: int

class ApproveFundRequest(BaseModel):
    request_id: str
    status: str

class UpdateCommissionRequest(BaseModel):
    level: int
    percentage: float

class UserResponse(BaseModel):
    id: str
    name: str
    mobile: str
    email: Optional[str] = None
    role: str
    referral_code: str
    main_wallet: float
    e_wallet: float
    coins: int
    has_pin: bool
    total_income: float
    today_income: float
    direct_referrals: int
    auto_placements: int
    completed_cycles: int
    created_at: str

@api_router.get("/check-referral/{code}")
async def check_referral(code: str):
    user = await db.users.find_one({"referral_code": code})
    if user:
        return {"exists": True, "name": user.get("name", "Unknown")}
    return {"exists": False, "name": None}

@api_router.post("/auth/register")
async def register(req: RegisterRequest, response: Response):
    existing = await db.users.find_one({"mobile": req.mobile})
    if existing:
        raise HTTPException(status_code=400, detail="Mobile already registered")
    
    referred_by_id = None
    if req.referral_code:
        referrer = await db.users.find_one({"referral_code": req.referral_code})
        if not referrer:
            raise HTTPException(status_code=400, detail="Invalid referral code")
        referred_by_id = str(referrer["_id"])
    
    user_doc = {
        "name": req.name,
        "mobile": req.mobile,
        "email": None,
        "password_hash": hash_password(req.password),
        "pin_hash": None,
        "referral_code": generate_referral_code(),
        "referred_by": referred_by_id,
        "role": "user",
        "main_wallet": 0.0,
        "e_wallet": 0.0,
        "coins": 0,
        "total_income": 0.0,
        "today_income": 0.0,
        "direct_referrals": 0,
        "auto_placements": 0,
        "completed_cycles": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    if referred_by_id:
        await db.users.update_one(
            {"_id": ObjectId(referred_by_id)},
            {"$inc": {"direct_referrals": 1}}
        )
        await handle_mlm_logic(user_id, referred_by_id)
    
    access_token = create_access_token(user_id, req.mobile, "user")
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {
        "id": user_id,
        "name": req.name,
        "mobile": req.mobile,
        "role": "user",
        "referral_code": user_doc["referral_code"],
        "has_pin": False
    }

@api_router.post("/auth/login")
async def login(req: LoginRequest, response: Response):
    user = await db.users.find_one({"mobile": req.mobile})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid mobile or password")
    
    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid mobile or password")
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, user["mobile"], user["role"])
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {
        "id": user_id,
        "name": user["name"],
        "mobile": user["mobile"],
        "role": user["role"],
        "referral_code": user.get("referral_code", ""),
        "has_pin": user.get("pin_hash") is not None
    }

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return {
        "id": user["_id"],
        "name": user["name"],
        "mobile": user["mobile"],
        "role": user["role"],
        "referral_code": user.get("referral_code", ""),
        "has_pin": user.get("pin_hash") is not None,
        "main_wallet": user.get("main_wallet", 0.0),
        "e_wallet": user.get("e_wallet", 0.0),
        "coins": user.get("coins", 0),
        "total_income": user.get("total_income", 0.0),
        "today_income": user.get("today_income", 0.0)
    }

@api_router.post("/auth/setup-pin")
async def setup_pin(req: SetupPINRequest, request: Request):
    user = await get_current_user(request)
    if len(req.pin) != 4 or not req.pin.isdigit():
        raise HTTPException(status_code=400, detail="PIN must be 4 digits")
    
    pin_hash = hash_password(req.pin)
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$set": {"pin_hash": pin_hash}}
    )
    return {"message": "PIN setup successful"}

@api_router.post("/auth/verify-pin")
async def verify_pin(req: VerifyPINRequest, request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    
    if not user_doc.get("pin_hash"):
        raise HTTPException(status_code=400, detail="PIN not set")
    
    if not verify_password(req.pin, user_doc["pin_hash"]):
        raise HTTPException(status_code=401, detail="Invalid PIN")
    
    return {"message": "PIN verified"}

@api_router.post("/auth/send-otp")
async def send_otp(req: SendOTPRequest):
    user = await db.users.find_one({"mobile": req.mobile})
    if not user:
        raise HTTPException(status_code=404, detail="Mobile not registered")
    
    otp = generate_otp()
    await db.otp_store.update_one(
        {"mobile": req.mobile},
        {"$set": {"otp": otp, "created_at": datetime.now(timezone.utc)}},
        upsert=True
    )
    return {"message": "OTP sent successfully"}

@api_router.post("/auth/verify-otp")
async def verify_otp(req: VerifyOTPRequest):
    otp_doc = await db.otp_store.find_one({"mobile": req.mobile})
    if not otp_doc:
        raise HTTPException(status_code=400, detail="OTP not found")
    
    if otp_doc["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    time_diff = datetime.now(timezone.utc) - otp_doc["created_at"]
    if time_diff.total_seconds() > 600:
        raise HTTPException(status_code=400, detail="OTP expired")
    
    return {"message": "OTP verified"}

@api_router.post("/auth/reset-password")
async def reset_password(req: ResetPasswordRequest):
    otp_doc = await db.otp_store.find_one({"mobile": req.mobile})
    if not otp_doc or otp_doc["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    await db.users.update_one(
        {"mobile": req.mobile},
        {"$set": {"password_hash": hash_password(req.new_password)}}
    )
    await db.otp_store.delete_one({"mobile": req.mobile})
    return {"message": "Password reset successful"}

@api_router.post("/auth/reset-pin")
async def reset_pin(req: ResetPINRequest):
    if len(req.new_pin) != 4 or not req.new_pin.isdigit():
        raise HTTPException(status_code=400, detail="PIN must be 4 digits")
    
    otp_doc = await db.otp_store.find_one({"mobile": req.mobile})
    if not otp_doc or otp_doc["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    await db.users.update_one(
        {"mobile": req.mobile},
        {"$set": {"pin_hash": hash_password(req.new_pin)}}
    )
    await db.otp_store.delete_one({"mobile": req.mobile})
    return {"message": "PIN reset successful"}

@api_router.get("/wallet/balance")
async def get_balance(request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    return {
        "main_wallet": user_doc.get("main_wallet", 0.0),
        "e_wallet": user_doc.get("e_wallet", 0.0),
        "coins": user_doc.get("coins", 0),
        "total_income": user_doc.get("total_income", 0.0),
        "today_income": user_doc.get("today_income", 0.0)
    }

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    today_joining = await db.users.count_documents({
        "referred_by": user["_id"],
        "created_at": {"$gte": today_start}
    })
    
    total_active_users = await db.users.count_documents({
        "referred_by": user["_id"],
        "status": {"$ne": "inactive"}
    })
    
    total_free_users = await db.users.count_documents({
        "referred_by": user["_id"],
        "subscription_type": "free"
    })
    
    return {
        "main_wallet": user_doc.get("main_wallet", 0.0),
        "e_wallet": user_doc.get("e_wallet", 0.0),
        "coins": user_doc.get("coins", 0),
        "total_income": user_doc.get("total_income", 0.0),
        "today_income": user_doc.get("today_income", 0.0),
        "today_repurchase_income": user_doc.get("today_repurchase_income", 0.0),
        "total_repurchase_income": user_doc.get("total_repurchase_income", 0.0),
        "today_joining": today_joining,
        "total_active_users": total_active_users,
        "total_free_users": total_free_users
    }

@api_router.post("/wallet/self-transfer")
async def self_transfer(req: SelfTransferRequest, request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    
    if not user_doc.get("pin_hash"):
        raise HTTPException(status_code=400, detail="PIN not set")
    
    if not verify_password(req.pin, user_doc["pin_hash"]):
        raise HTTPException(status_code=401, detail="Invalid PIN")
    
    if user_doc.get("main_wallet", 0.0) < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient main wallet balance")
    
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {
            "$inc": {
                "main_wallet": -req.amount,
                "e_wallet": req.amount
            }
        }
    )
    
    await db.transactions.insert_one({
        "user_id": user["_id"],
        "type": "self_transfer",
        "amount": req.amount,
        "status": "success",
        "description": "Main Wallet to E-Wallet",
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"message": "Transfer successful"}

@api_router.post("/wallet/user-transfer")
async def user_transfer(req: UserTransferRequest, request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    
    if not user_doc.get("pin_hash"):
        raise HTTPException(status_code=400, detail="PIN not set")
    
    if not verify_password(req.pin, user_doc["pin_hash"]):
        raise HTTPException(status_code=401, detail="Invalid PIN")
    
    receiver = await db.users.find_one({"mobile": req.receiver_mobile})
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    
    if str(receiver["_id"]) == user["_id"]:
        raise HTTPException(status_code=400, detail="Cannot transfer to self")
    
    if user_doc.get("e_wallet", 0.0) < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient E-Wallet balance")
    
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$inc": {"e_wallet": -req.amount}}
    )
    
    await db.users.update_one(
        {"_id": receiver["_id"]},
        {"$inc": {"e_wallet": req.amount}}
    )
    
    await db.transactions.insert_one({
        "user_id": user["_id"],
        "type": "user_transfer",
        "amount": -req.amount,
        "receiver_id": str(receiver["_id"]),
        "receiver_mobile": req.receiver_mobile,
        "status": "success",
        "description": f"Transferred to {req.receiver_mobile}",
        "created_at": datetime.now(timezone.utc)
    })
    
    await db.transactions.insert_one({
        "user_id": str(receiver["_id"]),
        "type": "user_transfer",
        "amount": req.amount,
        "sender_id": user["_id"],
        "sender_mobile": user["mobile"],
        "status": "success",
        "description": f"Received from {user['mobile']}",
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"message": "Transfer successful"}

class AddFundRequest(BaseModel):
    amount: float
    utr_number: Optional[str] = None
    screenshot_url: Optional[str] = None
    payment_method: Optional[str] = None
    remarks: Optional[str] = None

@api_router.post("/wallet/add-fund-request")
async def add_fund_request(req: AddFundRequest, request: Request):
    user = await get_current_user(request)
    
    fund_req = {
        "user_id": user["_id"],
        "mobile": user["mobile"],
        "name": user["name"],
        "amount": req.amount,
        "utr_number": req.utr_number,
        "screenshot_url": req.screenshot_url,
        "payment_method": req.payment_method,
        "remarks": req.remarks,
        "status": "pending",
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.fund_requests.insert_one(fund_req)
    return {"message": "Fund request submitted", "request_id": str(result.inserted_id)}

@api_router.post("/recharge")
async def recharge(req: RechargeRequest, request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    
    if req.payment_mode == "e_wallet":
        if user_doc.get("e_wallet", 0.0) < req.amount:
            raise HTTPException(status_code=400, detail="Insufficient E-Wallet balance")
        
        await db.users.update_one(
            {"_id": ObjectId(user["_id"])},
            {"$inc": {"e_wallet": -req.amount}}
        )
    elif req.payment_mode == "coins":
        if user_doc.get("coins", 0) < req.amount:
            raise HTTPException(status_code=400, detail="Insufficient coins")
        
        await db.users.update_one(
            {"_id": ObjectId(user["_id"])},
            {"$inc": {"coins": -int(req.amount)}}
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid payment mode")
    
    status = random.choice(["success", "success", "success", "pending"])
    
    recharge_doc = {
        "user_id": user["_id"],
        "type": req.recharge_type,
        "number": req.number,
        "operator": req.operator,
        "amount": req.amount,
        "payment_mode": req.payment_mode,
        "status": status,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.recharges.insert_one(recharge_doc)
    
    await db.transactions.insert_one({
        "user_id": user["_id"],
        "type": "recharge",
        "amount": -req.amount,
        "status": status,
        "description": f"{req.recharge_type} - {req.number}",
        "created_at": datetime.now(timezone.utc)
    })
    
    if status == "success":
        await distribute_commission(user["_id"], req.amount)
    
    return {"message": "Recharge initiated", "status": status, "recharge_id": str(result.inserted_id)}

@api_router.get("/transactions")
async def get_transactions(request: Request, type: Optional[str] = None, from_date: Optional[str] = None, to_date: Optional[str] = None, skip: int = 0, limit: int = 100):
    user = await get_current_user(request)
    
    query = {"user_id": user["_id"]}
    if type:
        query["type"] = type
    if from_date:
        query["created_at"] = {"$gte": datetime.fromisoformat(from_date)}
    if to_date:
        if "created_at" in query:
            query["created_at"]["$lte"] = datetime.fromisoformat(to_date)
        else:
            query["created_at"] = {"$lte": datetime.fromisoformat(to_date)}
    
    transactions = await db.transactions.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(min(limit, 500)).to_list(None)
    
    for txn in transactions:
        if isinstance(txn.get("created_at"), datetime):
            txn["created_at"] = txn["created_at"].isoformat()
    
    return {"transactions": transactions}

@api_router.get("/referral/tree")
async def get_referral_tree(request: Request):
    user = await get_current_user(request)
    
    referrals = await db.users.find(
        {"referred_by": user["_id"]},
        {"_id": 0, "name": 1, "mobile": 1, "direct_referrals": 1, "created_at": 1}
    ).to_list(1000)
    
    for ref in referrals:
        if isinstance(ref.get("created_at"), datetime):
            ref["created_at"] = ref["created_at"].isoformat()
    
    return {"referrals": referrals}

@api_router.get("/referral/stats")
async def get_referral_stats(request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    
    total_referrals = await db.users.count_documents({"referred_by": user["_id"]})
    
    return {
        "direct_referrals": user_doc.get("direct_referrals", 0),
        "auto_placements": user_doc.get("auto_placements", 0),
        "completed_cycles": user_doc.get("completed_cycles", 0),
        "total_referrals": total_referrals,
        "referral_code": user_doc.get("referral_code", "")
    }

@api_router.get("/profile")
async def get_profile(request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    
    return {
        "name": user_doc.get("name", ""),
        "mobile": user_doc.get("mobile", ""),
        "email": user_doc.get("email"),
        "address": user_doc.get("address"),
        "nominee_name": user_doc.get("nominee_name"),
        "nominee_relation": user_doc.get("nominee_relation"),
        "nominee_mobile": user_doc.get("nominee_mobile"),
        "kyc_aadhaar": user_doc.get("kyc_aadhaar"),
        "kyc_pan": user_doc.get("kyc_pan")
    }

@api_router.put("/profile")
async def update_profile(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    
    update_fields = {}
    if "name" in body:
        update_fields["name"] = body["name"]
    if "email" in body:
        update_fields["email"] = body["email"]
    if "address" in body:
        update_fields["address"] = body["address"]
    if "nominee_name" in body:
        update_fields["nominee_name"] = body["nominee_name"]
    if "nominee_relation" in body:
        update_fields["nominee_relation"] = body["nominee_relation"]
    if "nominee_mobile" in body:
        update_fields["nominee_mobile"] = body["nominee_mobile"]
    
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$set": update_fields}
    )
    
    return {"message": "Profile updated successfully"}

@api_router.post("/profile/upload-kyc")
async def upload_kyc(request: Request):
    user = await get_current_user(request)
    form = await request.form()
    file_type = form.get("type")
    
    field_name = f"kyc_{file_type}"
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$set": {field_name: f"uploaded_{file_type}_{datetime.now(timezone.utc).isoformat()}"}}
    )
    
    return {"message": f"{file_type} uploaded successfully"}

@api_router.get("/admin/dashboard")
async def admin_dashboard(request: Request):
    admin = await get_admin_user(request)
    
    total_users = await db.users.count_documents({"role": "user"})
    pending_funds = await db.fund_requests.count_documents({"status": "pending"})
    total_recharges = await db.recharges.count_documents({})
    
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
    recharge_sum = await db.recharges.aggregate(pipeline).to_list(1)
    total_recharge_amount = recharge_sum[0]["total"] if recharge_sum else 0
    
    return {
        "total_users": total_users,
        "pending_funds": pending_funds,
        "total_recharges": total_recharges,
        "total_recharge_amount": total_recharge_amount
    }

@api_router.get("/admin/users")
async def get_all_users(request: Request):
    admin = await get_admin_user(request)
    
    users = await db.users.find(
        {"role": "user"},
        {"password_hash": 0, "pin_hash": 0}
    ).sort("created_at", -1).to_list(1000)
    
    for user in users:
        user["_id"] = str(user["_id"])
        if isinstance(user.get("created_at"), datetime):
            user["created_at"] = user["created_at"].isoformat()
    
    return {"users": users}

@api_router.get("/admin/fund-requests")
async def get_fund_requests(request: Request, status: Optional[str] = None):
    admin = await get_admin_user(request)
    
    query = {}
    if status:
        query["status"] = status
    
    requests = await db.fund_requests.find(query).sort("created_at", -1).to_list(1000)
    
    for req in requests:
        req["_id"] = str(req["_id"])
        if isinstance(req.get("created_at"), datetime):
            req["created_at"] = req["created_at"].isoformat()
    
    return {"requests": requests}

@api_router.post("/admin/approve-fund")
async def approve_fund(req: ApproveFundRequest, request: Request):
    admin = await get_admin_user(request)
    
    fund_req = await db.fund_requests.find_one({"_id": ObjectId(req.request_id)})
    if not fund_req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if fund_req["status"] != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")
    
    await db.fund_requests.update_one(
        {"_id": ObjectId(req.request_id)},
        {"$set": {"status": req.status, "updated_at": datetime.now(timezone.utc)}}
    )
    
    if req.status == "approved":
        await db.users.update_one(
            {"_id": ObjectId(fund_req["user_id"])},
            {"$inc": {"e_wallet": fund_req["amount"]}}
        )
        
        await db.transactions.insert_one({
            "user_id": fund_req["user_id"],
            "type": "fund_added",
            "amount": fund_req["amount"],
            "status": "success",
            "description": "Fund added by admin",
            "created_at": datetime.now(timezone.utc)
        })
    
    return {"message": f"Request {req.status}"}

@api_router.get("/admin/coin-packages")
async def get_coin_packages(request: Request):
    admin = await get_admin_user(request)
    
    packages = await db.coin_packages.find({}, {"_id": 0}).to_list(100)
    return {"packages": packages}

@api_router.post("/admin/coin-packages")
async def create_coin_package(req: CoinPackageRequest, request: Request):
    admin = await get_admin_user(request)
    
    package = {
        "amount": req.amount,
        "coins": req.coins,
        "active": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.coin_packages.insert_one(package)
    return {"message": "Package created"}

@api_router.get("/admin/commission-settings")
async def get_commission_settings(request: Request):
    admin = await get_admin_user(request)
    
    settings = await db.commission_settings.find_one({"type": "mlm"})
    if not settings:
        default_settings = {
            "type": "mlm",
            "levels": {str(i): 2.0 for i in range(1, 21)}
        }
        await db.commission_settings.insert_one(default_settings)
        settings = default_settings
    
    settings.pop("_id", None)
    return settings

@api_router.post("/admin/commission-settings")
async def update_commission_settings(req: UpdateCommissionRequest, request: Request):
    admin = await get_admin_user(request)
    
    if req.level < 1 or req.level > 20:
        raise HTTPException(status_code=400, detail="Level must be between 1 and 20")
    
    await db.commission_settings.update_one(
        {"type": "mlm"},
        {"$set": {f"levels.{req.level}": req.percentage}},
        upsert=True
    )
    
    return {"message": "Commission updated"}

async def handle_mlm_logic(new_user_id: str, referrer_id: str):
    referrer = await db.users.find_one({"_id": ObjectId(referrer_id)})
    if not referrer:
        return
    
    direct_refs = referrer.get("direct_referrals", 0)
    completed_cycles = referrer.get("completed_cycles", 0)
    
    if completed_cycles >= 10:
        return
    
    if completed_cycles == 0 and direct_refs == 1:
        await db.users.update_one(
            {"_id": ObjectId(referrer_id)},
            {"$inc": {"completed_cycles": 1, "auto_placements": 1}}
        )
    elif completed_cycles > 0 and (direct_refs - 1) % 4 == 0:
        await db.users.update_one(
            {"_id": ObjectId(referrer_id)},
            {"$inc": {"completed_cycles": 1, "auto_placements": 1}}
        )

async def distribute_commission(user_id: str, amount: float):
    settings = await db.commission_settings.find_one({"type": "mlm"})
    if not settings:
        return
    
    current_user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not current_user:
        return
    
    level = 1
    current_referrer_id = current_user.get("referred_by")
    
    while current_referrer_id and level <= 20:
        commission_percentage = settings["levels"].get(str(level), 0)
        commission_amount = (amount * commission_percentage) / 100
        
        if commission_amount > 0:
            await db.users.update_one(
                {"_id": ObjectId(current_referrer_id)},
                {
                    "$inc": {
                        "main_wallet": commission_amount,
                        "total_income": commission_amount,
                        "today_income": commission_amount
                    }
                }
            )
            
            await db.transactions.insert_one({
                "user_id": current_referrer_id,
                "type": "commission",
                "amount": commission_amount,
                "status": "success",
                "description": f"Level {level} commission",
                "created_at": datetime.now(timezone.utc)
            })
        
        referrer = await db.users.find_one({"_id": ObjectId(current_referrer_id)})
        if not referrer:
            break
        current_referrer_id = referrer.get("referred_by")
        level += 1

@app.on_event("startup")
async def startup_event():
    admin_mobile = os.environ.get("ADMIN_MOBILE", "9999999999")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@123")
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@recharge.com")
    
    existing = await db.users.find_one({"mobile": admin_mobile})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "name": "Admin",
            "mobile": admin_mobile,
            "email": admin_email,
            "password_hash": hashed,
            "pin_hash": hash_password("1234"),
            "referral_code": "ADMIN001",
            "referred_by": None,
            "role": "admin",
            "main_wallet": 0.0,
            "e_wallet": 0.0,
            "coins": 0,
            "total_income": 0.0,
            "today_income": 0.0,
            "direct_referrals": 0,
            "auto_placements": 0,
            "completed_cycles": 0,
            "created_at": datetime.now(timezone.utc)
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"mobile": admin_mobile},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
    
    await db.users.create_index("mobile", unique=True)
    await db.users.create_index("referral_code", unique=True)
    
    credentials_content = f"""# Test Credentials

## Admin Account
- Mobile: {admin_mobile}
- Password: {admin_password}
- PIN: 1234
- Role: admin

## Test User
Create via signup with referral code: ADMIN001

## Endpoints
- Register: POST /api/auth/register
- Login: POST /api/auth/login
- Dashboard: GET /api/auth/me
"""
    
    Path("/app/memory").mkdir(exist_ok=True)
    Path("/app/memory/test_credentials.md").write_text(credentials_content)

# --- Shopping / Vendor Routes ---

class ProductRequest(BaseModel):
    name: str
    description: str
    price: float
    category: str
    stock: int
    image_url: Optional[str] = None

class AddToCartRequest(BaseModel):
    product_id: str
    quantity: int

@api_router.get("/vendor/status")
async def get_vendor_status(request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    return {"is_vendor": user_doc.get("is_vendor", False)}

@api_router.post("/vendor/register")
async def register_vendor(request: Request):
    user = await get_current_user(request)
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$set": {"is_vendor": True}}
    )
    return {"message": "You are now a vendor"}

@api_router.get("/products")
async def get_products(request: Request, skip: int = 0, limit: int = 50, category: Optional[str] = None):
    try:
        await get_current_user(request)
    except:
        pass
    query = {}
    if category:
        query["category"] = category
    products = await db.products.find(query, {"_id": 0}).skip(skip).limit(min(limit, 100)).to_list(None)
    return {"products": products}

@api_router.post("/products")
async def add_product(req: ProductRequest, request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    if not user_doc.get("is_vendor"):
        raise HTTPException(status_code=403, detail="Only vendors can add products")
    product = {
        "name": req.name,
        "description": req.description,
        "price": req.price,
        "category": req.category,
        "stock": req.stock,
        "image_url": req.image_url,
        "vendor_id": user["_id"],
        "vendor_name": user_doc.get("name", "Unknown"),
        "created_at": datetime.now(timezone.utc)
    }
    await db.products.insert_one(product)
    return {"message": "Product added successfully"}

@api_router.post("/cart/add")
async def add_to_cart(req: AddToCartRequest, request: Request):
    user = await get_current_user(request)
    cart_item = {
        "user_id": user["_id"],
        "product_id": req.product_id,
        "quantity": req.quantity,
        "added_at": datetime.now(timezone.utc)
    }
    existing = await db.cart.find_one({"user_id": user["_id"], "product_id": req.product_id})
    if existing:
        await db.cart.update_one(
            {"_id": existing["_id"]},
            {"$inc": {"quantity": req.quantity}}
        )
    else:
        await db.cart.insert_one(cart_item)
    return {"message": "Added to cart"}

# --- Banner Routes (Text Banner + Image Banner) ---

class TextBannerRequest(BaseModel):
    text: str
    color: str

class ImageBannerRequest(BaseModel):
    images: List[str]

class FullBannerRequest(BaseModel):
    text: Optional[str] = None
    color: Optional[str] = None
    images: Optional[List[str]] = None

@api_router.get("/banner")
async def get_banner():
    text_banner = await db.settings.find_one({"type": "text_banner"})
    image_banner = await db.settings.find_one({"type": "image_banner"})
    if not text_banner:
        text_banner = {
            "type": "text_banner",
            "text": "Earn Smart - Grow Fast - Achieve More",
            "color": "from-purple-600 via-pink-600 to-rose-600"
        }
        await db.settings.insert_one(text_banner)
    if not image_banner:
        image_banner = {
            "type": "image_banner",
            "images": []
        }
        await db.settings.insert_one(image_banner)
    text_banner.pop("_id", None)
    image_banner.pop("_id", None)
    return {
        "text": text_banner.get("text", ""),
        "color": text_banner.get("color", "from-purple-600 via-pink-600 to-rose-600"),
        "images": image_banner.get("images", [])
    }

@api_router.post("/admin/banner/text")
async def update_text_banner(req: TextBannerRequest, request: Request):
    await get_admin_user(request)
    await db.settings.update_one(
        {"type": "text_banner"},
        {"$set": {"text": req.text, "color": req.color}},
        upsert=True
    )
    return {"message": "Text banner updated"}

@api_router.post("/admin/banner/image")
async def update_image_banner(req: ImageBannerRequest, request: Request):
    await get_admin_user(request)
    await db.settings.update_one(
        {"type": "image_banner"},
        {"$set": {"images": req.images}},
        upsert=True
    )
    return {"message": "Image banner updated"}

@api_router.post("/admin/banner")
async def update_banner(req: FullBannerRequest, request: Request):
    await get_admin_user(request)
    if req.text is not None or req.color is not None:
        text_update = {}
        if req.text is not None:
            text_update["text"] = req.text
        if req.color is not None:
            text_update["color"] = req.color
        await db.settings.update_one(
            {"type": "text_banner"},
            {"$set": text_update},
            upsert=True
        )
    if req.images is not None:
        await db.settings.update_one(
            {"type": "image_banner"},
            {"$set": {"images": req.images}},
            upsert=True
        )
    return {"message": "Banner updated"}

@api_router.post("/admin/banner/upload")
async def upload_banner_image(request: Request, file: UploadFile = File(...)):
    await get_admin_user(request)
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "jpg"
    if ext not in ("jpg", "jpeg", "png", "gif", "webp"):
        raise HTTPException(status_code=400, detail="Only image files allowed (jpg, png, gif, webp)")
    filename = f"banner_{uuid.uuid4().hex[:12]}.{ext}"
    filepath = UPLOAD_DIR / filename
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    with open(filepath, "wb") as f:
        f.write(content)
    image_url = f"/uploads/{filename}"
    return {"url": image_url, "message": "Image uploaded"}

# --- Bank Withdrawal Route ---

class WithdrawRequest(BaseModel):
    amount: float
    pin: str
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None

@api_router.post("/wallet/withdraw")
async def withdraw_to_bank(req: WithdrawRequest, request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    if not user_doc.get("pin_hash"):
        raise HTTPException(status_code=400, detail="PIN not set")
    if not verify_password(req.pin, user_doc["pin_hash"]):
        raise HTTPException(status_code=401, detail="Invalid PIN")
    if req.amount < 100:
        raise HTTPException(status_code=400, detail="Minimum withdrawal is 100")
    if user_doc.get("main_wallet", 0.0) < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient main wallet balance")
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$inc": {"main_wallet": -req.amount}}
    )
    withdrawal_doc = {
        "user_id": user["_id"],
        "amount": req.amount,
        "bank_name": req.bank_name,
        "account_number": req.account_number,
        "ifsc_code": req.ifsc_code,
        "status": "pending",
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.withdrawals.insert_one(withdrawal_doc)
    await db.transactions.insert_one({
        "user_id": user["_id"],
        "type": "withdrawal",
        "amount": -req.amount,
        "status": "pending",
        "description": f"Bank withdrawal - {req.bank_name or 'N/A'}",
        "created_at": datetime.now(timezone.utc)
    })
    return {"message": "Withdrawal request submitted", "request_id": str(result.inserted_id)}

@api_router.get("/admin/withdrawals")
async def get_withdrawals(request: Request, status: Optional[str] = None):
    await get_admin_user(request)
    query = {}
    if status:
        query["status"] = status
    withdrawals = await db.withdrawals.find(query).sort("created_at", -1).to_list(1000)
    for w in withdrawals:
        w["_id"] = str(w["_id"])
        if isinstance(w.get("created_at"), datetime):
            w["created_at"] = w["created_at"].isoformat()
    return {"withdrawals": withdrawals}

class ApproveWithdrawalRequest(BaseModel):
    request_id: str
    status: str

@api_router.post("/admin/approve-withdrawal")
async def approve_withdrawal(req: ApproveWithdrawalRequest, request: Request):
    await get_admin_user(request)
    wd = await db.withdrawals.find_one({"_id": ObjectId(req.request_id)})
    if not wd:
        raise HTTPException(status_code=404, detail="Request not found")
    if wd["status"] != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")
    await db.withdrawals.update_one(
        {"_id": ObjectId(req.request_id)},
        {"$set": {"status": req.status, "updated_at": datetime.now(timezone.utc)}}
    )
    if req.status == "rejected":
        await db.users.update_one(
            {"_id": ObjectId(wd["user_id"])},
            {"$inc": {"main_wallet": wd["amount"]}}
        )
    await db.transactions.update_one(
        {"user_id": wd["user_id"], "type": "withdrawal", "amount": -wd["amount"], "status": "pending"},
        {"$set": {"status": req.status}}
    )
    return {"message": f"Withdrawal {req.status}"}

# --- Include Router & Middleware (MUST be after ALL route definitions) ---

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
