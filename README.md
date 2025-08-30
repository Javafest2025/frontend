<div align="center">
  <h1>🎓 ScholarAI Frontend</h1>
  <p><strong>Next.js AI-Powered Academic Research Platform</strong></p>
  
  [![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

  <p>A cutting-edge React/Next.js frontend for ScholarAI - revolutionizing academic research with AI-powered tools, collaborative features, and intelligent document management.</p>

  [Live Demo](https://scholarai.com) · [Documentation](https://docs.scholarai.com) · [Report Bug](https://github.com/Javafest2025/frontend/issues) · [Request Feature](https://github.com/Javafest2025/frontend/issues)
</div>

---

## ✨ **Core Features**

### 🤖 **AI-Powered Research Assistant**
- **ScholarBot Chat**: Intelligent conversational AI for research queries and paper analysis
- **Document Q&A**: Ask questions about uploaded PDFs and get contextual answers
- **Smart Summarization**: AI-generated summaries and key insights from academic papers
- **Research Gap Analysis**: AI identifies research opportunities and novel directions

### 📚 **Advanced Document Management**
- **Multi-Format Support**: PDF, LaTeX, Markdown, and DOC file processing
- **Smart Paper Library**: Organize and categorize research papers with AI tagging
- **Web Search Integration**: Automated retrieval from arXiv, PubMed, Semantic Scholar, CORE
- **Citation Management**: Automatic citation extraction and formatting

### 👥 **Collaborative Research**
- **Project Workspaces**: Create and manage research projects with team members
- **Shared Libraries**: Collaborative paper collections and annotations
- **Real-time Collaboration**: Live document editing and commenting
- **Author Management**: Track contributors and research collaborators

### 📊 **Research Analytics**
- **Paper Scoring**: AI-powered relevance and impact scoring
- **Progress Tracking**: Monitor reading lists and research milestones  
- **Impact Metrics**: Citation analysis and research trend identification
- **Custom Dashboards**: Personalized research overview and insights

### 🔧 **Developer Experience**
- **Modern Tech Stack**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Component Library**: Radix UI primitives with custom ScholarAI design system
- **Performance Optimized**: Server-side rendering, image optimization, lazy loading
- **Testing Suite**: Jest unit tests and Playwright E2E testing

---

## 🚀 **Quick Start**

### Prerequisites
- **Node.js** 20+ (LTS recommended)
- **npm**, **yarn**, or **pnpm** package manager
- **Docker** (optional, for containerized development)

### 🛠️ **Local Development**

1. **Clone and Install**
   ```bash
   git clone https://github.com/Javafest2025/frontend.git
   cd frontend
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp env.example .env.local
   ```
   
   Configure your `.env.local` file:
   ```env
   # API Configuration
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8989
   NEXT_PUBLIC_ENV=dev
   
   # Authentication (OAuth Client IDs - Public)
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   NEXT_PUBLIC_GITHUB_CLIENT_ID=your-github-client-id
   
   # Cloud Services
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   🌐 **Application available at:** `http://localhost:3000`

### 🐳 **Docker Development**

```bash
# Using Docker Compose
docker-compose up -d

# Or using the included script
./scripts/docker.sh up
```

---

## 🏗️ **Architecture Overview**

### 📁 **Project Structure**
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── interface/         # Main application interface
│   └── api/               # API routes and middleware
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── auth/             # Authentication components  
│   ├── chat/             # AI chat interface
│   ├── document/         # Document viewers and editors
│   ├── interface/        # Application-specific components
│   └── layout/           # Layout and navigation
├── lib/                   # Utilities and configurations
│   ├── api/              # API client functions
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Helper functions
├── types/                 # TypeScript type definitions
└── styles/               # Global styles and Tailwind config
```

### 🔌 **Key Integrations**

- **Backend APIs**: RESTful microservices communication
- **Authentication**: OAuth 2.0 (Google, GitHub) + JWT
- **File Storage**: Backblaze B2 for documents, Cloudinary for images
- **AI Services**: Google Gemini for document analysis and chat
- **PDF Processing**: PDF.js for viewer and text extraction
- **Real-time Features**: WebSocket connections for live collaboration

---

## 🎨 **Design System**

### 🎯 **UI Components**
Built on **Radix UI** primitives with custom ScholarAI styling:

- **Buttons & Forms**: Accessible, keyboard-navigable components
- **Data Display**: Tables, cards, badges, and progress indicators  
- **Navigation**: Responsive menus, tabs, and breadcrumbs
- **Overlays**: Modals, tooltips, and slide-over panels
- **Feedback**: Toast notifications, loading states, and error handling

### 🌈 **Theme System**
- **Light/Dark Mode**: Automatic system preference detection
- **Custom Color Palette**: Academic-focused color scheme
- **Responsive Design**: Mobile-first approach with breakpoints
- **Animations**: Framer Motion for smooth interactions

---

## 🧪 **Testing Strategy**

### 🔍 **Testing Stack**
- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright for user journey testing
- **Component Tests**: Isolated component behavior verification
- **Integration Tests**: API communication and data flow

### 🚀 **Running Tests**

```bash
# All tests
npm run test:all

# Unit tests only
npm run test

# E2E tests only  
npm run test:e2e

# E2E with UI mode
npm run test:e2e -- --ui

# Watch mode for development
npm run test -- --watch
```

### 📊 **Test Coverage**
- **Components**: 90%+ coverage for UI components
- **API Integration**: Mock external services for consistent testing
- **User Flows**: Critical paths like authentication, document upload, chat

---

## 🔧 **Development Workflow**

### 📋 **Scripts Available**

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server  
npm run lint         # ESLint code linting
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests
```

### 🏗️ **Build & Deployment**

```bash
# Production build
npm run build

# Docker build
docker build -t scholarai-frontend .

# Using deployment script
./scripts/docker.sh build
```

### 🔄 **Development Guidelines**

1. **Component Development**
   - Use TypeScript for all components
   - Follow atomic design principles
   - Include proper prop types and documentation

2. **State Management**
   - React hooks for local state
   - Context for global state when needed
   - Server state managed by API hooks

3. **Styling Standards**
   - Tailwind CSS for styling
   - Component variants using `class-variance-authority`
   - Responsive design first

4. **Code Quality**
   - ESLint + Prettier for formatting
   - Pre-commit hooks for code quality
   - TypeScript strict mode enabled

---

## 🌐 **Environment Configuration**

### 🏠 **Development Environment**
```env
NEXT_PUBLIC_ENV=dev
NEXT_PUBLIC_API_BASE_URL=http://localhost:8989
```

### 🐳 **Docker Environment**  
```env
NEXT_PUBLIC_ENV=docker
NEXT_PUBLIC_API_BASE_URL=http://localhost:8989
```

### 🚀 **Production Environment**
```env
NEXT_PUBLIC_ENV=prod
NEXT_PUBLIC_API_BASE_URL=https://api.scholarai.com
```

---

## 📱 **Feature Highlights**

### 🔍 **Smart Paper Discovery**
- **Multi-Source Search**: Integrates with 5+ academic databases
- **AI-Powered Filtering**: Relevance scoring and duplicate detection  
- **Real-time Results**: Streaming search results with progress tracking
- **Advanced Filters**: Date range, domain, publication type, impact factor

### 💬 **Intelligent Chat System**
- **Context-Aware Conversations**: Chat with specific papers or general research topics
- **Citation Support**: Automatic citation insertion and verification
- **Research Assistance**: Writing help, methodology suggestions, gap analysis
- **Multi-Modal Input**: Text, PDF excerpts, and image analysis

### 📖 **Document Processing**
- **Universal PDF Viewer**: Annotation, highlighting, and note-taking
- **LaTeX Editor**: Integrated editor with live preview and compilation
- **Batch Processing**: Upload and process multiple documents simultaneously
- **Format Conversion**: Convert between PDF, LaTeX, Markdown, and DOC

### 📊 **Analytics Dashboard**
- **Research Metrics**: Track reading progress, citation counts, collaboration stats
- **Trend Analysis**: Identify emerging research areas and opportunities
- **Team Performance**: Monitor collaborative project progress
- **Impact Tracking**: Publication metrics and citation analysis

---

## 🤝 **Contributing**

We welcome contributions from the academic and developer communities!

### 🚀 **Getting Started**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### 📋 **Contribution Guidelines**
- Follow the existing code style and conventions
- Add tests for new features and bug fixes
- Update documentation for significant changes
- Ensure all tests pass before submitting PR

### 🐛 **Reporting Issues**
- Use the GitHub issue tracker
- Provide detailed reproduction steps
- Include screenshots for UI issues
- Specify browser and OS versions

---

## 📄 **License**

This project is licensed under the **MIT License** - see the [LICENSE.md](LICENSE.md) file for details.

---

## 🙏 **Acknowledgments**

- **Next.js Team** for the amazing React framework
- **Radix UI** for accessible component primitives  
- **Tailwind CSS** for the utility-first CSS framework
- **Vercel** for deployment and hosting solutions
- **Academic Community** for feedback and feature requests

---

<div align="center">
  <p><strong>Built with ❤️ for the research community</strong></p>
  <p>
    <a href="https://scholarai.com">Website</a> •
    <a href="https://docs.scholarai.com">Documentation</a> •
    <a href="https://github.com/Javafest2025/frontend/issues">Support</a> •
    <a href="https://twitter.com/scholarai">Twitter</a>
  </p>
</div> 