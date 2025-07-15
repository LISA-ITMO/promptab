# PrompTab

Intelligent Chrome extension for prompt optimization using AI techniques including RAG, Chain-of-Thought, Role-playing, Few-shot learning and other.

## Features

### Core Functionality
- **Intelligent Prompt Optimization**: Automatic prompt improvement using AI techniques
- **RAG System**: Retrieval-Augmented Generation with vector knowledge base
- **Interactive Variables**: Create and manage variables in prompts for reusability
- **Template Library**: Save and organize frequently used prompts
- **Direct Integration**: Send optimized prompts to ChatGPT and Perplexity
- **Multilingual Support**: Russian and English languages

### Advanced AI Techniques
- **Chain-of-Thought**: Step-by-step reasoning for complex prompts
- **Role-playing**: Context-aware persona-based optimization
- **Few-shot Learning**: Example-based prompt enhancement
- **Vector Search**: Semantic similarity for relevant examples
- **Context Awareness**: Intelligent context preservation

## Architecture

### Backend Stack
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 14+ with pgvector extension
- **Vector Store**: Sentence Transformers + pgvector
- **LLM Integration**: OpenAI, Perplexity, Ollama
- **Caching**: Redis for performance optimization
- **Authentication**: JWT-based security
- **Monitoring**: Prometheus + Grafana
- **Container**: Docker + Docker Compose

### Frontend Stack
- **Framework**: React 18 + TypeScript
- **Build System**: Webpack 5 with optimization
- **UI Library**: Material-UI (MUI) v5
- **State Management**: React Query for server state
- **Internationalization**: i18next
- **Extension**: Chrome Extension Manifest V3
- **Testing**: Jest + React Testing Library

### Infrastructure
- **Database**: PostgreSQL with pgvector for embeddings
- **Cache**: Redis for session and data caching
- **LLM Services**: Multiple AI provider integrations
- **Monitoring**: Prometheus metrics + Grafana dashboards
- **Reverse Proxy**: Nginx for production deployment
- **Local LLM**: Ollama for open-source model support

## Installation

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.11+ (for backend development)
- PostgreSQL 14+ with pgvector extension
- Redis 7+

### Quick Start with Docker

1. **Clone the repository**
```bash
git clone https://github.com/LISA-ITMO/promptab.git
cd promptab
```

2. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

3. **Start all services**
```bash
docker-compose up -d
```

4. **Install Chrome extension**
- Open Chrome and go to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked extension"
- Select the `frontend/dist` folder

### Manual Setup

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-docs.txt

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
cd frontend
npm install

# Development mode
npm start

# Build for production
npm run build

# Package extension
npm run package
```

## Configuration

### Environment Variables

Create `.env` file in the root directory:

```env
# Database
POSTGRES_DB=promptab
POSTGRES_USER=promptab_user
POSTGRES_PASSWORD=your_password
DATABASE_URL=postgresql://promptab_user:your_password@localhost:5432/promptab

# Redis
REDIS_URL=redis://localhost:6379

# LLM API Keys
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
PERPLEXITY_API_KEY=your_perplexity_key

# Security
SECRET_KEY=your_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Monitoring
SENTRY_DSN=your_sentry_dsn
PROMETHEUS_PORT=9090

# Ollama (Local LLM)
OLLAMA_BASE_URL=http://localhost:11434
```

### API Configuration

The backend provides RESTful API endpoints:

- **Authentication**: `/api/auth/`
- **Prompts**: `/api/prompts/`
- **Templates**: `/api/templates/`
- **Variables**: `/api/variables/`
- **Optimization**: `/api/optimize/`
- **Health Check**: `/health`

## Testing

### Backend Tests
```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test categories
pytest tests/test_api_prompts.py
pytest tests/test_services.py
pytest tests/test_models.py
```

<!-- ### Frontend Tests
```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch


### Integration Tests
```bash
# Run full integration test suite
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
``` -->

## Documentation

### Backend Documentation
- **Live Documentation**: [GitHub Pages](https://LISA-ITMO.github.io/promptab/)
- **API Reference**: Complete API documentation with examples
- **Architecture Guide**: Detailed system architecture and design decisions
- **Development Guide**: Setup and development workflow

<!-- ### Frontend Documentation
- **Component Library**: React components with JSDoc documentation
- **TypeScript Types**: Complete type definitions
- **Extension Guide**: Chrome extension development guide -->

### Building Documentation Locally
```bash
# Backend documentation
cd backend
./scripts/build_docs.sh

# View locally
cd docs/_build/html
python -m http.server 8000
```

## CI/CD Pipeline

### GitHub Actions Workflows

1. **Documentation Pipeline** (`.github/workflows/docs.yml`)
   - Automatic Sphinx documentation build
   - Quality checks and validation
   - Deployment to GitHub Pages

<!-- 2. **Testing Pipeline** (`.github/workflows/test.yml`)
   - Backend and frontend tests
   - Code coverage reporting
   - Security scanning

3. **Deployment Pipeline** (`.github/workflows/deploy.yml`)
   - Docker image building
   - Container registry push
   - Production deployment -->

### Quality Assurance
- **Code Quality**: ESLint, Prettier, Black, Ruff
- **Type Checking**: TypeScript, MyPy
- **Security**: Bandit, Safety
- **Performance**: Bundle analysis, load testing

<!-- ## Deployment

### Production Deployment

1. **Build and push Docker images**
```bash
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml push
```

2. **Deploy to production**
```bash
docker-compose -f docker-compose.prod.yml up -d
``` -->

<!-- ### Monitoring and Observability

- **Metrics**: Prometheus + Grafana dashboards
- **Logging**: Structured logging with Loguru
- **Error Tracking**: Sentry integration
- **Health Checks**: Automated health monitoring -->

## Development

### Project Structure
```
promptab/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Core configuration
│   │   ├── db/             # Database models
│   │   ├── models/         # Pydantic models
│   │   ├── schemas/        # API schemas
│   │   └── services/       # Business logic
│   ├── docs/               # Sphinx documentation
│   ├── tests/              # Backend tests
│   └── scripts/            # Build and utility scripts
├── frontend/               # React Chrome extension
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   ├── utils/          # Utility functions
│   │   ├── popup/          # Extension popup
│   │   ├── options/        # Extension options
│   │   ├── background/     # Background scripts
│   │   └── contentScript/  # Content scripts
│   ├── scripts/            # Build scripts
│   └── dist/               # Built extension
├── docker/                 # Docker configurations
├── docs/                   # Project documentation
└── .github/                # GitHub Actions workflows
```

<!-- ### Development Commands

#### Backend
```bash
cd backend

# Code formatting
black app/
ruff check app/
ruff format app/

# Type checking
mypy app/

# Run tests
pytest

# Database migrations
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

#### Frontend
```bash
cd frontend

# Development
npm start

# Building
npm run build
npm run build:analyze

# Testing
npm test
npm run test:coverage

# Linting
npm run lint
npm run lint:fix

# Packaging
npm run package
npm run package:crx
npm run package:zip
``` -->

## Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

3. **Make your changes**
4. **Run tests and linting**
```bash
# Backend
cd backend && pytest && black app/ && ruff check app/

# Frontend
cd frontend && npm test && npm run lint
```

5. **Commit your changes**
```bash
git commit -m "feat: add your feature description"
```

6. **Push and create a pull request**

### Code Standards

- **Backend**: Follow PEP 8, use type hints, add docstrings
- **Frontend**: Follow ESLint rules, use TypeScript, add JSDoc
- **Testing**: Maintain >80% code coverage
- **Documentation**: Update docs for new features

## Security

### Security Features

- **Authentication**: JWT-based secure authentication
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API rate limiting and abuse prevention
- **HTTPS**: Secure communication protocols
- **Secrets Management**: Environment-based configuration

### Security Best Practices

- Regular dependency updates
- Security scanning in CI/CD
- Input validation and sanitization
- Proper error handling
- Secure session management

<!-- ## 📈 Roadmap

### Planned Features

- [ ] 

### Technical Improvements

- [ ]  -->

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/LISA-ITMO/promptab/issues)
- **Documentation**: [GitHub Pages](https://LISA-ITMO.github.io/promptab/)
- **Discussions**: [GitHub Discussions](https://github.com/LISA-ITMO/promptab/discussions)
- **Email**: natig.aminov@gmail.com

---
