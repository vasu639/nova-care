"""
NovaMart AI Customer Support Agent - FastAPI Data Models
Pydantic schemas and database models designed for SQLite / PostgreSQL compatibility.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

DecisionType = Literal["ANSWER", "ASK", "ACT", "ESCALATE"]

class CustomerSchema(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    risk_score: float = Field(default=0.0, description="0.0 to 1.0; >= 0.70 is flagged fraud risk")
    created_at: str

class ProductSchema(BaseModel):
    id: str
    name: str
    category: str
    price: float
    returnable: bool = True
    warranty_months: int = 12

class OrderItemSchema(BaseModel):
    id: str
    order_id: str
    product_id: str
    product_name: Optional[str] = None
    category: Optional[str] = None
    quantity: int = 1
    unit_price: float
    total_price: float

class OrderSchema(BaseModel):
    id: str
    customer_id: str
    status: str
    tracking_number: str
    courier: str
    placed_at: str
    delivered_at: Optional[str] = None
    policy_snapshot_date: str
    total_amount: float
    currency: str = "INR"
    delivery_otp_verified: bool = False
    shipping_address: str
    payment_status: str
    payment_method: str
    items: Optional[List[OrderItemSchema]] = []

class VersionedPolicySchema(BaseModel):
    id: str
    category: str
    version: str
    effective_from: str
    effective_to: Optional[str] = None
    return_window_days: int
    restocking_percent: float
    approval_threshold: float
    allow_opened_items: bool = True
    description: str

class EvidenceSchema(BaseModel):
    customer_verified: bool
    order_verified: bool
    ownership_verified: bool
    payment_verified: bool
    delivery_verified: bool
    policy_verified: bool
    window_verified: bool
    refund_amount_verified: bool
    notes: Optional[List[str]] = []

class SupportTicketSchema(BaseModel):
    id: str
    customer_id: str
    order_id: Optional[str] = None
    issue_type: str
    reason: str
    status: str = "open"
    priority: str = "medium"
    created_at: str

class ExecutedActionSchema(BaseModel):
    type: str
    id: str
    summary: str
    payload: Dict[str, Any]

class TraceEntrySchema(BaseModel):
    step: str
    status: str
    timestamp: str
    details: Any

class ClarificationOptionSchema(BaseModel):
    id: str
    label: str
    details: Optional[str] = None

class ClarificationGroupSchema(BaseModel):
    type: str
    options: List[ClarificationOptionSchema]

# Request & Response Contracts
class SupportMessageRequest(BaseModel):
    customer_id: str
    message: str
    session_id: Optional[str] = None

class SupportAgentResponse(BaseModel):
    decision: DecisionType
    response: str
    reason_codes: List[str]
    policy_version: Optional[str]
    evidence: EvidenceSchema
    actions: List[ExecutedActionSchema]
    trace: List[TraceEntrySchema]
    ticket: Optional[SupportTicketSchema] = None
    clarification_options: Optional[ClarificationGroupSchema] = None
