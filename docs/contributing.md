# Contributing to BitaURL

## 🎯 Welcome Contributors!

Thank you for your interest in contributing to BitaURL! We welcome contributions from developers of all skill levels. Whether you're fixing bugs, adding features, improving documentation, or helping with testing, your contributions make BitaURL better for everyone.

## 🤝 Code of Conduct

### Our Pledge
We are committed to making participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards
- **Be respectful** - Treat everyone with respect and kindness
- **Be inclusive** - Welcome newcomers and help them learn
- **Be collaborative** - Work together to solve problems
- **Be constructive** - Provide helpful feedback and suggestions
- **Be patient** - Remember that everyone is learning

### Enforcement
Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to the project maintainers at conduct@bitaurl.com.

## 🚀 Getting Started

### 1. Fork and Clone
```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/bitaurl.git
cd bitaurl

# Add upstream remote
git remote add upstream https://github.com/bitaurl/bitaurl.git
```

### 2. Set Up Development Environment
Follow our [Getting Started Guide](getting-started.md) to set up your local development environment.

### 3. Create a Branch
```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

## 📋 Types of Contributions

### 🐛 Bug Reports
Help us improve by reporting bugs you encounter.

**Before submitting a bug report:**
- Check if the issue already exists in [GitHub Issues](https://github.com/bitaurl/bitaurl/issues)
- Try to reproduce the issue with the latest version
- Gather relevant information (browser, OS, steps to reproduce)

**Bug Report Template:**
```markdown
**Bug Description**
A clear description of what the bug is.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Environment**
- OS: [e.g., macOS 13.2]
- Browser: [e.g., Chrome 109]
- Version: [e.g., 1.0.0]

**Screenshots**
If applicable, add screenshots to help explain the problem.

**Additional Context**
Any other context about the problem.
```

### ✨ Feature Requests
Suggest new features or improvements.

**Feature Request Template:**
```markdown
**Feature Description**
A clear description of the feature you'd like to see.

**Problem Statement**
What problem does this feature solve?

**Proposed Solution**
How would you like this feature to work?

**Alternatives Considered**
Other solutions you've considered.

**Additional Context**
Any other context, mockups, or examples.
```

### 🔧 Code Contributions

#### Backend Contributions (Spring Boot)
- **Languages**: Java 17+
- **Framework**: Spring Boot 3.x
- **Database**: MongoDB
- **Testing**: JUnit 5, Mockito, TestContainers

#### Frontend Contributions (React)
- **Languages**: TypeScript, JavaScript
- **Framework**: React 18
- **Styling**: Tailwind CSS
- **Testing**: Jest, React Testing Library, Cypress

#### Admin Panel Contributions (React)
- **Languages**: TypeScript, JavaScript
- **Framework**: React 18
- **Styling**: Tailwind CSS
- **Charts**: Recharts

## 🛠️ Development Guidelines

### Code Style

#### Java/Spring Boot
```java
// Use meaningful variable names
public class UrlService {
    private final UrlRepository urlRepository;
    private final AnalyticsService analyticsService;
    
    // Use builder pattern for complex objects
    public UrlResponse createUrl(CreateUrlRequest request, String userId) {
        Url url = Url.builder()
            .shortCode(generateShortCode())
            .originalUrl(request.getOriginalUrl())
            .userId(userId)
            .title(request.getTitle())
            .createdAt(LocalDateTime.now())
            .build();
        
        return UrlResponse.from(urlRepository.save(url));
    }
    
    // Use descriptive method names
    private String generateUniqueShortCode() {
        // Implementation
    }
}
```

#### TypeScript/React
```typescript
// Use TypeScript interfaces
interface UrlFormProps {
  onSubmit: (data: CreateUrlRequest) => Promise<void>;
  initialData?: Partial<CreateUrlRequest>;
  isLoading?: boolean;
}

// Use functional components with hooks
export const UrlForm: React.FC<UrlFormProps> = ({ 
  onSubmit, 
  initialData, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState<CreateUrlRequest>({
    originalUrl: initialData?.originalUrl || '',
    title: initialData?.title || '',
    description: initialData?.description || ''
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form fields */}
    </form>
  );
};
```

### Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

#### Examples
```bash
feat(auth): add Google OAuth integration
fix(urls): resolve duplicate short code generation
docs(api): update authentication endpoints
test(frontend): add URL form validation tests
refactor(backend): improve error handling structure
```

### Testing Requirements

#### Backend Testing
```java
// Unit tests are required for all service methods
@ExtendWith(MockitoExtension.class)
class UrlServiceTest {
    
    @Mock
    private UrlRepository urlRepository;
    
    @InjectMocks
    private UrlService urlService;
    
    @Test
    @DisplayName("Should create URL successfully with valid input")
    void createUrl_ShouldReturnUrlResponse_WhenValidInput() {
        // Given
        CreateUrlRequest request = CreateUrlRequest.builder()
            .originalUrl("https://example.com")
            .build();
        
        // When & Then
        // Test implementation
    }
}

// Integration tests for controllers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class UrlControllerIntegrationTest {
    // Test implementation
}
```

#### Frontend Testing
```typescript
// Component tests are required
import { render, screen, fireEvent } from '@testing-library/react';
import { UrlForm } from './UrlForm';

describe('UrlForm Component', () => {
  it('should submit form with valid data', async () => {
    const mockOnSubmit = jest.fn();
    
    render(<UrlForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/original url/i), {
      target: { value: 'https://example.com' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      originalUrl: 'https://example.com'
    });
  });
});
```

### Code Coverage Requirements
- **Backend**: Minimum 80% line coverage, 75% branch coverage
- **Frontend**: Minimum 75% line coverage
- **Critical paths**: 90%+ coverage required

## 📝 Pull Request Process

### 1. Before Submitting
- [ ] Code follows project style guidelines
- [ ] Tests are written and passing
- [ ] Documentation is updated if needed
- [ ] Commit messages follow conventional format
- [ ] Branch is up to date with main

### 2. Pull Request Template
```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass (if applicable)
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### 3. Review Process
1. **Automated Checks**: CI/CD pipeline runs tests and checks
2. **Code Review**: Maintainers review code for quality and standards
3. **Testing**: Changes are tested in staging environment
4. **Approval**: At least one maintainer approval required
5. **Merge**: Changes are merged into main branch

## 🏗️ Project Structure

### Backend Structure
```
backend/src/main/java/com/urlshortener/
├── controller/          # REST controllers
├── service/            # Business logic
├── repository/         # Data access layer
├── model/             # Entity classes
├── dto/               # Data transfer objects
├── config/            # Configuration classes
├── security/          # Security components
├── exception/         # Exception handling
└── util/              # Utility classes
```

### Frontend Structure
```
frontend/src/
├── components/        # Reusable components
├── pages/            # Page components
├── hooks/            # Custom React hooks
├── context/          # React context providers
├── services/         # API service layer
├── utils/            # Utility functions
├── types/            # TypeScript definitions
└── styles/           # Global styles
```

## 🔍 Code Review Guidelines

### For Contributors
- **Self-review** your code before submitting
- **Write clear descriptions** of what your PR does
- **Respond promptly** to review feedback
- **Keep PRs focused** - one feature/fix per PR
- **Update documentation** when needed

### For Reviewers
- **Be constructive** in feedback
- **Explain the "why"** behind suggestions
- **Approve quickly** when code meets standards
- **Test the changes** when possible
- **Focus on** logic, security, performance, and maintainability

### Review Checklist
- [ ] Code is readable and well-documented
- [ ] Tests cover the changes adequately
- [ ] No security vulnerabilities introduced
- [ ] Performance impact is acceptable
- [ ] Error handling is appropriate
- [ ] API changes are backward compatible (if applicable)

## 🚀 Release Process

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Cycle
- **Major releases**: Quarterly
- **Minor releases**: Monthly
- **Patch releases**: As needed for critical fixes

## 🏆 Recognition

### Contributors
All contributors are recognized in:
- **README.md** contributors section
- **CHANGELOG.md** for each release
- **GitHub releases** notes

### Maintainer Path
Active contributors may be invited to become maintainers based on:
- Consistent, quality contributions
- Understanding of project goals
- Positive community interaction
- Technical expertise in relevant areas

## 📚 Resources

### Documentation
- [Getting Started Guide](getting-started.md)
- [Architecture Documentation](architecture/README.md)
- [API Documentation](api/README.md)
- [Testing Guide](testing/README.md)

### Tools & Setup
- [Development Environment Setup](getting-started.md#manual-setup)
- [Code Style Configuration](.editorconfig)
- [Pre-commit Hooks](.pre-commit-config.yaml)

### Learning Resources
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://react.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🆘 Getting Help

### Questions & Discussions
- **GitHub Discussions**: For general questions and ideas
- **Discord**: Real-time chat with the community
- **Stack Overflow**: Tag questions with `bitaurl`

### Reporting Issues
- **Bugs**: Use GitHub Issues with bug report template
- **Security**: Email security@bitaurl.com (do not use public issues)
- **Feature Requests**: Use GitHub Issues with feature request template

### Contact
- **General**: hello@bitaurl.com
- **Development**: developers@bitaurl.com
- **Security**: security@bitaurl.com
- **Conduct**: conduct@bitaurl.com

---

Thank you for contributing to BitaURL! Your efforts help make this project better for everyone. 🚀