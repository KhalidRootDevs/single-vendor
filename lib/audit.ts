import connectDB from '@/lib/database';
import { AuditLog } from '@/models/AuditLog';
import mongoose from 'mongoose';

interface AuditEventParams {
  adminId: string | mongoose.Types.ObjectId;
  adminEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  userAgent?: string;
}

export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    await connectDB();
    await AuditLog.create({
      adminId: params.adminId,
      adminEmail: params.adminEmail,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: String(params.resourceId),
      before: params.before,
      after: params.after,
      ip: params.ip,
      userAgent: params.userAgent
    });
  } catch (error) {
    // Audit log failure must never break the main operation
    console.error('[audit] Failed to write audit event:', error);
  }
}
