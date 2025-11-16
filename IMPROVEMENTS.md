# PlanMaker SaaS - Improvements Roadmap

This document tracks identified improvements for performance, functionality, and code quality.

**Last Updated**: 2025-01-16
**Total Improvements**: 76 identified
**Completed**: 1/76 (1.3%)

---

## 📊 Progress by Priority

| Priority | Total | Completed | In Progress | Pending |
|----------|-------|-----------|-------------|---------|
| Critical | 10 | 1 | 0 | 9 |
| High | 31 | 0 | 0 | 31 |
| Medium | 24 | 0 | 0 | 24 |
| Low | 11 | 0 | 0 | 11 |

---

## 🔴 CRITICAL PRIORITY (10 items)

### Security Issues

- [ ] **#1: Missing Input Validation DTOs** - ✅ **IN PROGRESS**
  - **Status**: Auth module completed
  - **Remaining**: Profile, Plan, Template, Subscription, User modules
  - **Impact**: Prevents injection attacks, ensures data integrity
  - **Effort**: 2-3 days
  - **Files**: All `*`.controller.ts` files

- [ ] **#2: Weak Authorization Checks**
  - **Location**: `packages/api/src/modules/plan/plan.controller.ts:31`
  - **Issue**: Using generic `throw new Error('Unauthorized')`
  - **Fix**: Use NestJS `UnauthorizedException`, `ForbiddenException`
  - **Effort**: 4 hours

- [ ] **#3: Missing Rate Limiting on Critical Endpoints**
  - **Issue**: No specific rate limiting on AI generation endpoints
  - **Impact**: Potential abuse, high Gemini API costs
  - **Fix**: Add `@Throttle()` decorator to expensive operations
  - **Effort**: 1 day

- [ ] **#4: No API Key Validation**
  - **Location**: `packages/api/src/common/gemini/gemini.service.ts:34`
  - **Issue**: Falls back to 'dummy-key' if GEMINI_API_KEY not set
  - **Fix**: Throw error at startup if key missing
  - **Effort**: 2 hours

- [ ] **#5: Insecure File Upload Configuration**
  - **Location**: `packages/api/src/common/storage/storage.service.ts:50`
  - **Issue**: Using `ACL: 'public-read'` for all uploads
  - **Fix**: Make ACL configurable, default to private
  - **Effort**: 4 hours

- [ ] **#6: Missing CSRF Protection**
  - **Location**: `packages/api/src/main.ts`
  - **Issue**: No CSRF tokens for state-changing operations
  - **Fix**: Add `csurf` middleware for cookie-based sessions
  - **Effort**: 1 day

- [ ] **#7: No Database Transaction Management**
  - **Location**: `packages/api/src/modules/plan/plan-generation.service.ts:187-216`
  - **Issue**: Multiple DB writes without transactions
  - **Fix**: Wrap in Prisma transactions
  - **Effort**: 2 days

- [ ] **#8: No Error Logging Service**
  - **Issue**: Inconsistent error logging (console.log, Logger, nothing)
  - **Fix**: Implement Winston logger with structured logging
  - **Effort**: 2 days

- [ ] **#9: Missing Health Check Endpoints**
  - **Issue**: No `/health` or `/readiness` endpoints
  - **Fix**: Add NestJS TerminusModule health checks
  - **Effort**: 1 day

- [ ] **#10: No Database Connection Pooling Configuration**
  - **Location**: `packages/api/src/common/prisma/prisma.service.ts`
  - **Issue**: Using default Prisma settings
  - **Fix**: Configure connection pool size, timeout
  - **Effort**: 4 hours

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
