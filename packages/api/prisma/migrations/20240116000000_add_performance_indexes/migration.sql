-- Add performance indexes for commonly queried fields

-- User queries (login, search by email, tenant filtering)
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");

-- Plan queries (user plans, status filtering, date filtering)
CREATE INDEX IF NOT EXISTS "Plan_userId_idx" ON "Plan"("userId");
CREATE INDEX IF NOT EXISTS "Plan_tenantId_idx" ON "Plan"("tenantId");
CREATE INDEX IF NOT EXISTS "Plan_status_idx" ON "Plan"("status");
CREATE INDEX IF NOT EXISTS "Plan_createdAt_idx" ON "Plan"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Plan_startDate_idx" ON "Plan"("startDate");

-- Template queries (niche filtering, tenant filtering, public templates)
CREATE INDEX IF NOT EXISTS "Template_tenantId_idx" ON "Template"("tenantId");
CREATE INDEX IF NOT EXISTS "Template_niche_idx" ON "Template"("niche");
CREATE INDEX IF NOT EXISTS "Template_level_idx" ON "Template"("level");
CREATE INDEX IF NOT EXISTS "Template_isPublic_idx" ON "Template"("isPublic");

-- Exercise queries (niche filtering, tenant filtering)
CREATE INDEX IF NOT EXISTS "Exercise_tenantId_idx" ON "Exercise"("tenantId");
CREATE INDEX IF NOT EXISTS "Exercise_niche_idx" ON "Exercise"("niche");
CREATE INDEX IF NOT EXISTS "Exercise_intensity_idx" ON "Exercise"("intensity");

-- PlanDay queries (plan filtering, date filtering)
CREATE INDEX IF NOT EXISTS "PlanDay_planId_idx" ON "PlanDay"("planId");
CREATE INDEX IF NOT EXISTS "PlanDay_date_idx" ON "PlanDay"("date");

-- Session queries (plan day filtering, status filtering)
CREATE INDEX IF NOT EXISTS "Session_planDayId_idx" ON "Session"("planDayId");
CREATE INDEX IF NOT EXISTS "Session_status_idx" ON "Session"("status");

-- Profile queries (user filtering, tenant filtering)
CREATE INDEX IF NOT EXISTS "Profile_userId_idx" ON "Profile"("userId");
CREATE INDEX IF NOT EXISTS "Profile_tenantId_idx" ON "Profile"("tenantId");
CREATE INDEX IF NOT EXISTS "Profile_niche_idx" ON "Profile"("niche");

-- Subscription queries (user filtering, status filtering, expiry date)
CREATE INDEX IF NOT EXISTS "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS "Subscription_tenantId_idx" ON "Subscription"("tenantId");
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX IF NOT EXISTS "Subscription_currentPeriodEnd_idx" ON "Subscription"("currentPeriodEnd");

-- RefreshToken queries (user filtering, expiry cleanup)
CREATE INDEX IF NOT EXISTS "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX IF NOT EXISTS "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- AuditLog queries (tenant filtering, user filtering, event type, timestamp)
CREATE INDEX IF NOT EXISTS "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_eventType_idx" ON "AuditLog"("eventType");
CREATE INDEX IF NOT EXISTS "AuditLog_severity_idx" ON "AuditLog"("severity");
CREATE INDEX IF NOT EXISTS "AuditLog_timestamp_idx" ON "AuditLog"("timestamp" DESC);
