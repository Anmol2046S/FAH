# Contributing to FAH - Food and Health AI

Thank you for your interest in contributing to the FAH project!

## 🤝 Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/FAH.git
   cd FAH
   ```
3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📋 Development Setup

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm start

# Open http://localhost:3000
```

## 🔄 Development Workflow

### Before You Start
- Check existing issues and PRs
- Create an issue for your feature/bug
- Get feedback before starting work

### Code Style
- Use consistent indentation (2 spaces)
- Follow ES6+ standards
- Add comments for complex logic
- Keep functions small and focused

### Commit Guidelines
```
feat: Add food analysis feature
fix: Correct calorie calculation
docs: Update API documentation
style: Format code
refactor: Improve performance
test: Add unit tests
chore: Update dependencies
```

### Testing
```bash
# Run tests before pushing
npm test

# Check code quality
npm run lint
```

## 📤 Submitting Changes

1. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**
   - Clear title and description
   - Link related issues
   - Add screenshots if UI changes
   - Explain testing performed

## ✅ PR Checklist

- [ ] Code follows project style
- [ ] Changes tested locally
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] Commit messages clear
- [ ] No console errors/warnings
- [ ] Environment variables properly handled

## 🐛 Bug Reports

Include:
- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Node.js and npm versions
- Operating system
- Relevant error logs

## 💡 Feature Requests

Describe:
- Problem solved
- Proposed solution
- Use cases and benefits
- Alternative approaches considered

## 📚 Documentation

- Update README.md for major changes
- Add inline code comments
- Document new endpoints/functions
- Update .env.example if adding variables

## 🔐 Security

- Never commit secrets or API keys
- Review security implications
- Follow Node.js security best practices
- Report security issues privately

## 🎯 Code Review Process

- Maintain respectful tone
- Provide constructive feedback
- Test changes locally
- Approve when satisfied

## 📝 License

By contributing, you agree to license your contributions under MIT License.

---

Thank you for making FAH better! 🙏
