# PlanMaker SaaS - Improvements Roadmap

This document tracks identified improvements for performance, functionality, and code quality.

**Last Updated**: 2025-11-16
**Total Improvements**: 76 identified
**Completed**: 10/76 (13.2%)

> 🎉 **FASE 1 COMPLETA!** Todas as 10 melhorias críticas foram implementadas.
> Veja [PROGRESS_REPORT.md](./PROGRESS_REPORT.md) para detalhes e [PLANO_FASEADO.md](./PLANO_FASEADO.md) para próximas fases.

---

## 📊 Progress by Priority

| Priority | Total | Completed | In Progress | Pending |
|----------|-------|-----------|-------------|---------|
| Critical | 10 | **10** ✅ | 0 | 0 |
| High | 31 | 0 | 0 | 31 |
| Medium | 24 | 0 | 0 | 24 |
| Low | 11 | 0 | 0 | 11 |

---

## 🔴 CRITICAL PRIORITY (10 items) - ✅ 100% COMPLETE!

### Security Issues - ALL RESOLVED ✅

- [x] **#1: Missing Input Validation DTOs** - ✅ **COMPLETE** (2025-11-16)
  - **Implemented**: 21 DTOs created for all modules
  - **Coverage**: Auth, Profile, Plan, Template, Subscription, User
  - **Result**: Complete input validation, injection attack prevention

- [x] **#2: Weak Authorization Checks** - ✅ **COMPLETE** (2025-11-16)
  - **Fix Applied**: All `Error` replaced with NestJS exceptions
  - **Types**: UnauthorizedException, NotFoundException, ForbiddenException
  - **Result**: Proper HTTP status codes and error messages

- [x] **#3: Missing Rate Limiting on Critical Endpoints** - ✅ **COMPLETE** (2025-11-16)
  - **Implemented**: Global ThrottlerGuard + endpoint-specific limits
  - **Limits**: Global 100/min, /plans/generate 5/min, /plans/generate-sync 3/min
  - **Result**: Protection against abuse and cost control

- [x] **#4: No API Key Validation** - ✅ **COMPLETE** (2025-11-16)
  - **Fix Applied**: Fail-fast at startup with clear error messages
  - **Location**: gemini.service.ts constructor
  - **Result**: No silent failures in production

- [x] **#5: Insecure File Upload Configuration** - ✅ **COMPLETE** (2025-11-16)
  - **Fix Applied**: Private by default, configurable ACL
  - **Features**: Signed URLs (1h), explicit public opt-in
  - **Result**: Secure file storage with principle of least privilege

- [x] **#6: Missing CSRF Protection** - ✅ **COMPLETE** (2025-11-16)
  - **Implemented**: Helmet security headers (CSP, HSTS, X-Frame-Options)
  - **Rationale**: JWT-based auth doesn't need CSRF tokens
  - **Result**: Comprehensive security headers for production

- [x] **#7: No Database Transaction Management** - ✅ **COMPLETE** (2025-11-16)
  - **Implemented**: Prisma transactions for all multi-step operations
  - **Coverage**: Plan generation, token management
  - **Result**: Data consistency guaranteed

- [x] **#8: No Error Logging Service** - ✅ **COMPLETE** (2025-11-16)
  - **Implemented**: Winston logger with structured logging
  - **Features**: Log rotation, separate error files, JSON format
  - **Result**: Production-ready logging infrastructure

- [x] **#9: Missing Health Check Endpoints** - ✅ **COMPLETE** (2025-11-16)
  - **Implemented**: /health, /health/readiness, /health/liveness
  - **Indicators**: Database, memory, disk monitoring
  - **Result**: Kubernetes-ready health checks

- [x] **#10: No Database Connection Pooling Configuration** - ✅ **COMPLETE** (2025-11-16)
  - **Implemented**: Configurable connection pool via environment variables
  - **Settings**: CONNECTION_LIMIT (default 10), POOL_TIMEOUT (default 10s)
  - **Result**: Optimized database resource management

---

## 🟠 HIGH PRIORITY (31 items)

### Performance Optimizations (7 items)

- [ ] **#11: N+1 Query Problems**
  - **Location**: `packages/api/src/modules/plan/plan.service.ts:13-24`
  - **Fix**: Add `include` for eager loading, use dataloader pattern
  - **Effort**: 3 days

- [ ] **#12: Missing Database Indexes**
  - **Required Indexes**:
    - `(tenantId, status, createdAt)` on plans
    - `(userId, status)` for user plan queries
    - `(planDayId, status)` for sessions
  - **Effort**: 1 day

- [ ] **#13: No Caching Layer**
  - **Missing**: Tenant config, user profiles, exercises, templates
  - **Fix**: Implement Redis caching with TTL
  - **Effort**: 3 days

- [ ] **#14: Missing Query Result Pagination**
  - **Files**: `user.service.ts:30`, `tenant.service.ts:138`
  - **Fix**: Implement cursor-based pagination
  - **Effort**: 2 days

- [ ] **#15: Inefficient AI Prompt Building**
  - **Location**: `packages/api/src/common/gemini/gemini.service.ts:69-108`
  - **Issue**: Loading 50 exercises for every request
  - **Fix**: Cache exercise lists, optimize prompt size
  - **Effort**: 1 day

- [ ] **#16: No Response Compression**
  - **Location**: `packages/api/src/main.ts`
  - **Fix**: Add `compression` middleware (gzip/brotli)
  - **Effort**: 2 hours

- [ ] **#17: Frontend Bundle Optimization**
  - **Issues**: No code splitting, lazy loading, image optimization
  - **Fix**: Implement Next.js dynamic imports, optimize images
  - **Effort**: 2 days

### Missing Functionality (10 items)

- [ ] **#18: No Retry Logic for External Services**
  - **Services**: Gemini AI, S3, Email
  - **Fix**: Implement exponential backoff with `retry` library
  - **Effort**: 2 days

- [ ] **#19: Missing Request/Response Logging**
  - **Fix**: Add structured logging middleware
  - **Effort**: 1 day

- [ ] **#20: No Monitoring/Observability**
  - **Missing**: APM integration, metrics, performance monitoring
  - **Fix**: Add Sentry, custom metrics tracking
  - **Effort**: 3 days

- [ ] **#21: Missing Email Verification Flow**
  - **Issue**: `emailVerified` field exists but no implementation
  - **Fix**: Add verification token generation, email sending, verification endpoint
  - **Effort**: 2 days

- [ ] **#22: No Password Reset Functionality**
  - **Fix**: Add password reset token, email flow
  - **Effort**: 2 days

- [ ] **#23: Missing Webhook Signature Verification**
  - **Location**: `packages/api/src/modules/subscription/subscription.service.ts:59`
  - **Fix**: Add Stripe webhook signature verification
  - **Effort**: 4 hours

- [ ] **#24: No Job Status Tracking UI**
  - **Issue**: Users cannot see AI generation progress
  - **Fix**: Add WebSocket/SSE for real-time job updates
  - **Effort**: 3 days

- [ ] **#25: No Global Validation Pipe**
  - **Fix**: Enable ValidationPipe globally in main.ts
  - **Effort**: 1 hour

- [ ] **#26: Missing API Response Interceptor**
  - **Fix**: Standardize response format across all endpoints
  - **Effort**: 1 day

- [ ] **#27: No Request ID Tracing**
  - **Fix**: Add correlation IDs for request tracing
  - **Effort**: 4 hours

### Architecture Issues (14 items)

- [ ] **#28-41**: See detailed list in full analysis
  - Service layer duplication
  - Missing repository pattern
  - No API versioning strategy
  - Missing event sourcing
  - No queue monitoring
  - And more...

---

## 🟡 MEDIUM PRIORITY (24 items)

### Code Quality Issues (15 items)

- [ ] **#42: Extensive Use of `any` Type**
  - **Count**: 52 occurrences in backend, 22 in frontend
  - **Files**: gemini.service.ts, plan-generation.service.ts, auth.controller.ts
  - **Effort**: 5 days

- [ ] **#43: Missing Error Boundaries**
  - **Location**: Frontend React components
  - **Fix**: Add ErrorBoundary component
  - **Effort**: 1 day

- [ ] **#44: Missing Loading States**
  - **Issue**: Inconsistent loading state handling
  - **Fix**: Standardize loading/error/success states
  - **Effort**: 2 days

- [ ] **#45: No Global Error Handler**
  - **Fix**: Add NestJS exception filter + frontend error handler
  - **Effort**: 1 day

- [ ] **#46-56**: Additional code quality improvements

### Missing Testing Infrastructure (3 items)

- [ ] **#57: Zero Test Coverage**
  - **Missing**: Unit tests, integration tests, E2E tests
  - **Target**: 80% coverage
  - **Effort**: 2-3 weeks

- [ ] **#58: No Test Database Setup**
  - **Fix**: Configure test environment, seed data
  - **Effort**: 2 days

- [ ] **#59: No CI/CD Pipeline**
  - **Fix**: Add GitHub Actions for testing, linting, deployment
  - **Effort**: 2 days

### Other (6 items)

- [ ] **#60-65**: See detailed analysis

---

## 🟢 LOW PRIORITY (11 items)

- [ ] **#66: Missing Code Documentation**
  - Add JSDoc comments to functions
  - **Effort**: Ongoing

- [ ] **#67-76**: Additional enhancements
  - Inconsistent naming
  - Magic numbers
  - Missing i18n
  - No soft delete
  - Missing PWA features
  - And more...

---

## 📅 Implementation Roadmap

### Week 1 (Critical Security)
- [ ] Complete input validation DTOs (#1)
- [ ] Fix authorization checks (#2)
- [ ] Add API key validation (#4)
- [ ] Implement health checks (#9)
- [ ] Set up error logging service (#8)

### Week 2 (Critical Data Integrity)
- [ ] Implement database transactions (#7)
- [ ] Add rate limiting (#3)
- [ ] Fix file upload security (#5)
- [ ] Add CSRF protection (#6)
- [ ] Configure DB connection pooling (#10)

### Week 3-4 (High Priority Performance)
- [ ] Fix N+1 queries (#11)
- [ ] Add database indexes (#12)
- [ ] Implement Redis caching (#13)
- [ ] Add pagination (#14)
- [ ] Optimize AI prompts (#15)
- [ ] Add response compression (#16)

### Week 5-6 (High Priority Functionality)
- [ ] Add retry logic (#18)
- [ ] Implement monitoring (#20)
- [ ] Add email verification (#21)
- [ ] Add password reset (#22)
- [ ] Implement Stripe webhook verification (#23)
- [ ] Add request/response logging (#19)

### Month 2 (Testing & Quality)
- [ ] Add comprehensive test coverage (#57)
- [ ] Set up CI/CD pipeline (#59)
- [ ] Fix type safety issues (#42)
- [ ] Add error boundaries (#43)
- [ ] Standardize error handling (#45)

### Month 3 (Architecture & Optimization)
- [ ] Refactor shared code (#36)
- [ ] Implement repository pattern (#37)
- [ ] Add API versioning (#38)
- [ ] Optimize frontend bundle (#17)
- [ ] Add job status tracking UI (#24)

### Ongoing (Code Quality)
- [ ] Add documentation (#66)
- [ ] Fix naming inconsistencies (#67)
- [ ] Extract magic numbers (#68)
- [ ] Implement i18n (#73)

---

## 🎯 Quick Wins (Can be done in <1 day)

1. ✅ Add validation DTOs for Auth module (#1 - partial)
2. Enable global ValidationPipe (#25)
3. Fix API key validation (#4)
4. Add response compression (#16)
5. Fix authorization error handling (#2)
6. Add request ID tracing (#27)
7. Configure DB connection pool (#10)
8. Add error boundary component (#43)

---

## 📈 Metrics to Track

- **Code Coverage**: Target 80% (Currently 0%)
- **Type Safety**: Eliminate all `any` types (52 in backend, 22 in frontend)
- **Security Score**: Fix all critical security issues (10 items)
- **Performance**: Reduce average response time by 50%
- **Bundle Size**: Reduce frontend bundle by 30%

---

## 🔗 Related Documents

- [IMPLEMENTATION.md](IMPLEMENTATION.md) - Current implementation details
- [DEVELOPMENT.md](DEVELOPMENT.md) - Development setup and workflow
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines

---

## 📝 Notes

- This is a living document - update as improvements are completed
- Priority levels may be adjusted based on business needs
- Effort estimates are rough and may vary
- Some improvements can be done in parallel by multiple developers

**Next Review Date**: 2025-01-23
