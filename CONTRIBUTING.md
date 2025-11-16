# Contributing to PlanMaker SaaS

Thank you for your interest in contributing to PlanMaker! This document provides guidelines and best practices for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Keep discussions professional

## Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/plan-maker.git
cd plan-maker

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/plan-maker.git
```

### 2. Setup Development Environment

```bash
# Run automated setup
yarn setup

# Or follow manual setup in DEVELOPMENT.md
```

### 3. Create a Feature Branch

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

## Development Workflow

### Branch Naming

Use descriptive branch names with prefixes:

- `feature/` - New features (e.g., `feature/social-login`)
- `fix/` - Bug fixes (e.g., `fix/login-validation`)
- `refactor/` - Code refactoring (e.g., `refactor/api-client`)
- `docs/` - Documentation changes (e.g., `docs/setup-guide`)
- `test/` - Test additions/fixes (e.g., `test/auth-endpoints`)
- `chore/` - Maintenance tasks (e.g., `chore/update-dependencies`)

### Making Changes

1. **Write code** following our [Coding Standards](#coding-standards)
2. **Write tests** for new functionality
3. **Update documentation** as needed
4. **Run linters** to ensure code quality
5. **Test locally** before committing

```bash
# Run tests
yarn test

# Run linters
yarn lint

# Check TypeScript types
yarn workspace @planmaker/api tsc --noEmit
yarn workspace @planmaker/frontend tsc --noEmit

# Verify health
yarn health
```

## Coding Standards

### TypeScript

- Use **TypeScript strict mode** for all packages
- Define proper types - avoid `any`
- Use interfaces for object shapes
- Use enums for fixed sets of values
- Document complex types with JSDoc comments

```typescript
// Good
interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

function getProfile(userId: string): Promise<UserProfile> {
  // implementation
}

// Bad
function getProfile(userId: any): any {
  // implementation
}
```

### Code Style

We use ESLint and Prettier for consistent code formatting.

```bash
# Format code
yarn lint

# Auto-fix issues
yarn workspace @planmaker/api lint
```

**Key conventions:**
- Use **2 spaces** for indentation
- Use **single quotes** for strings
- Use **semicolons**
- Max line length: **100 characters**
- Use **camelCase** for variables and functions
- Use **PascalCase** for classes and types
- Use **UPPER_SNAKE_CASE** for constants

### File Organization

```
packages/api/src/
├── modules/              # Feature modules
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   └── dto/          # Data Transfer Objects
│   │       ├── login.dto.ts
│   │       └── register.dto.ts
│   └── ...
├── common/               # Shared utilities
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
└── main.ts
```

### Naming Conventions

**Files:**
- `user.service.ts` - Services
- `user.controller.ts` - Controllers
- `user.dto.ts` - DTOs
- `user.entity.ts` - Database entities
- `user.spec.ts` - Test files

**Classes:**
- `UserService` - Services
- `UserController` - Controllers
- `CreateUserDto` - DTOs
- `User` - Entities

### Comments

Write clear, concise comments:

```typescript
// Good - Explains WHY
// Use exponential backoff to prevent overwhelming the API during failures
const retryDelay = Math.pow(2, attemptNumber) * 1000;

// Bad - Explains WHAT (obvious from code)
// Multiply 2 by attempt number and multiply by 1000
const retryDelay = Math.pow(2, attemptNumber) * 1000;
```

## Commit Guidelines

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks
- `perf` - Performance improvements

**Examples:**

```bash
feat(auth): add Google OAuth integration

- Implemented Google OAuth 2.0 flow
- Added passport-google-oauth20 strategy
- Created callback endpoint
- Updated user model to support OAuth providers

Closes #123

---

fix(api): resolve CORS issue for custom domains

The tenant middleware was not setting CORS headers correctly
for custom domains. This fix ensures proper headers are set
based on the resolved tenant configuration.

Fixes #456

---

docs(readme): update setup instructions

- Added automated setup script documentation
- Clarified Gemini API key configuration
- Added troubleshooting section
```

### Commit Best Practices

- **Write clear, descriptive messages**
- **Keep commits atomic** - one logical change per commit
- **Reference issues** - use "Fixes #123" or "Closes #456"
- **Test before committing** - ensure tests pass
- **Don't commit secrets** - check .env files, API keys

## Pull Request Process

### Before Submitting

1. **Update from upstream**
```bash
git fetch upstream
git rebase upstream/main
```

2. **Run all checks**
```bash
yarn test          # Run tests
yarn lint          # Run linters
yarn build         # Ensure builds succeed
yarn health        # Verify setup
```

3. **Update documentation**
- Update README.md if needed
- Add/update JSDoc comments
- Update DEVELOPMENT.md for setup changes

### Submitting PR

1. **Push to your fork**
```bash
git push origin feature/your-feature-name
```

2. **Create Pull Request** on GitHub

3. **Fill out PR template** with:
   - Clear description of changes
   - Related issue numbers
   - Screenshots (for UI changes)
   - Testing steps
   - Breaking changes (if any)

### PR Template

```markdown
## Description
Brief description of what this PR does.

## Related Issues
Closes #123
Related to #456

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that breaks existing functionality)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
- [ ] Dependent changes merged
```

### Review Process

- Maintainers will review your PR
- Address feedback promptly
- Make requested changes
- Re-request review after updates
- Be patient and respectful

## Testing Requirements

### Unit Tests

All new code must include unit tests:

```typescript
// user.service.spec.ts
describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
  });

  describe('createUser', () => {
    it('should create a user with valid data', async () => {
      const userData = { email: 'test@example.com', name: 'Test' };
      const user = await service.createUser(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
    });

    it('should throw error for duplicate email', async () => {
      const userData = { email: 'test@example.com', name: 'Test' };
      await service.createUser(userData);

      await expect(service.createUser(userData))
        .rejects
        .toThrow('Email already exists');
    });
  });
});
```

### Coverage Requirements

- Minimum **80% code coverage** for new code
- **100% coverage** for critical paths (auth, payments)
- Run coverage report: `yarn test:cov`

### E2E Tests

For API endpoints, add E2E tests:

```typescript
// auth.e2e-spec.ts
describe('AuthController (e2e)', () => {
  it('/auth/login (POST) should login successfully', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'test@demo.com', password: 'test123' })
      .expect(200)
      .expect((res) => {
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.user.email).toBe('test@demo.com');
      });
  });
});
```

## Documentation

### Code Documentation

Use JSDoc for public APIs:

```typescript
/**
 * Generates a personalized activity plan using Gemini AI
 *
 * @param input - Plan generation input parameters
 * @param input.profileId - User profile ID
 * @param input.planType - Type of plan to generate
 * @param input.startDate - Plan start date
 * @returns Promise resolving to generated plan
 * @throws {BadRequestException} If profile not found
 * @throws {ServiceUnavailableException} If Gemini API fails
 *
 * @example
 * ```typescript
 * const plan = await service.generatePlan({
 *   profileId: 'user-123',
 *   planType: 'weekly',
 *   startDate: new Date(),
 * });
 * ```
 */
async generatePlan(input: GeneratePlanInput): Promise<Plan> {
  // implementation
}
```

### README Updates

Update README.md for:
- New features
- Configuration changes
- Breaking changes
- New dependencies

### DEVELOPMENT.md Updates

Update DEVELOPMENT.md for:
- Setup process changes
- New environment variables
- New scripts
- Troubleshooting tips

## Questions?

- Open an issue for questions
- Join our Discord (if available)
- Email: dev@planmaker.io

## License

By contributing, you agree that your contributions will be licensed under the project's license.

---

Thank you for contributing to PlanMaker! 🎉
