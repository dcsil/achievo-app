# Achievo App Release - Initial Version

## Direct Links to Submitted Files

### Backend Implementation
- [Main Flask Application](../../backend/app/main.py) - Core API server
- [PDF Extractor Service](../../backend/app/services/pdf_extractor.py) - Gemini AI integration
- [File Upload Utilities](../../backend/app/utils/file_utils.py) - File handling
- [Database Client](../../backend/database/db_client.py) - SQL connection management
- [Database Module](../../backend/database/database_module.py) - Schema initialization
- [Users Repository](../../backend/database/users_repository.py) | [Tasks Repository](../../backend/database/tasks_repository.py) | [Assignments Repository](../../backend/database/assignments_repository.py)
- [Courses Repository](../../backend/database/courses_repository.py) | [Blind Box Repositories](../../backend/database/blind_box_series_repository.py)

### Frontend Implementation
- [App Component](../../frontend/src/App.tsx) | [Home Page](../../frontend/src/pages/Home/index.tsx) | [Header](../../frontend/src/components/header/index.tsx) | [Footer](../../frontend/src/components/footer/index.tsx)
- [Task Container](../../frontend/src/components/task-container/index.tsx) | [Course Container](../../frontend/src/components/course-container/index.tsx) | [Task Complete Modal](../../frontend/src/components/task-complete/index.tsx)
- [User Context](../../frontend/src/api-contexts/user-context.ts) | [Get Courses API](../../frontend/src/api-contexts/get-courses.tsx) | [Get Assignments API](../../frontend/src/api-contexts/get-assignments.tsx)

### Testing & CI/CD
- [User API Tests](../../tests/test_users_api.py) | [Task API Tests](../../tests/test_tasks_api.py) | [Blind Box Tests](../../tests/test_blindbox_api.py) | [Test Runner](../../run_tests.sh)
- [Frontend Tests Workflow](../../.github/workflows/frontend-unit-tests.yml) | [Python Tests](../../.github/workflows/python-tests.yml) | [API Tests](../../.github/workflows/database-api-tests.yml)

### Documentation
- [Backend README](../../backend/README.md) | [Database README](../../backend/database/README.md) | [Frontend README](../../frontend/README.md) | [Tests README](../../tests/README.md)

---

## Roadmap Update

### Team Progress and Assignment Contents

Our team has successfully built Achievo, a gamified task management application for university students. This initial release delivers comprehensive backend infrastructure, database integration, and an engaging React frontend with key features including automatic task extraction from PDF syllabi using Google Gemini AI, complete task management with scheduling and tracking, course progress visualization, and a reward system with blind box collectibles. The application connects to Databricks SQL for scalable persistence and includes robust testing with over 25 API test cases and CI/CD workflows.

### Issues Created Since Last Release

As our initial release, we've addressed fundamental implementation tasks:

1. **Backend API Development** - Complete CRUD operations for users, tasks, assignments, courses, and gamification features with error handling and validation
2. **AI Integration** - Google Gemini API integration for intelligent PDF parsing and automatic deadline extraction
3. **Database Architecture** - Seven-table schema supporting users, courses, assignments, tasks, and gamification with proper relationships
4. **Frontend Dashboard** - Intuitive interface displaying today's tasks, upcoming tasks, and course progress with real-time updates
5. **Testing Infrastructure** - Comprehensive API testing suite with automated CI/CD pipelines
6. **Gamification System** - Points-based rewards with blind box purchases and figure collection

### Roadmap Changes

No significant changes from our original roadmap. We're proceeding with our planned MVP delivery, focusing on core task management and gamification features. Future iterations will build on this foundation based on user feedback.

---

## Roadmap Change Details

### Architecture

Our three-tier architecture ensures scalability. The **Backend** uses Flask with modular repository pattern for database access. The **Database** leverages Databricks SQL Warehouse with seven interconnected tables. The **Frontend** implements React with TypeScript and Tailwind CSS. RESTful APIs enable communication between layers, with Gemini AI integration for document processing.

### UI/UX

The interface prioritizes simplicity and motivation with clear sections for today's tasks, upcoming tasks, and course progress. Task completion triggers celebratory animations and point displays using gamification psychology. Color coding differentiates courses while progress bars provide visual feedback. The responsive design works seamlessly across mobile and desktop devices.

### Research

Our design draws from educational technology and gamification research showing immediate feedback and reward systems increase student task completion rates. The blind box mechanic creates sustained engagement through variable reward schedules. We researched student pain points: overwhelming syllabi, multi-course tracking difficulties, and motivation decline. Our PDF extraction addresses syllabus overload while course-based organization provides clarity. Color psychology guides UI choices.

### Decisions Log

Key technical decisions: (1) **Flask over FastAPI** for maturity and rapid development, (2) **Databricks SQL over PostgreSQL** for cloud-native scalability, (3) **Gemini AI over Custom NLP** for superior accuracy, (4) **React Hooks over Redux** for simplicity, (5) **Custom Components** for design flexibility, (6) **Integration Tests First** for end-to-end validation.

---

## Milestone Update

### Jobs to Be Done (JTBD)

**Primary**: Auto-extract assignments from syllabi for immediate planning ✅ *Implemented via PDF extraction with Gemini AI*

**Secondary**: Receive immediate feedback and rewards on task completion ✅ *Task completion triggers points, animations, and rewards*

**Tertiary**: Quickly understand priorities on dashboard ✅ *Separate "Today's Tasks" and "Upcoming Tasks" sections*

**Supporting**: Earn and spend points on engaging rewards ✅ *Blind box purchase system with randomized figures*

**Infrastructure**: Reliable performance at scale ✅ *Databricks SQL backend with comprehensive testing*

---

## User Research

User research is planned for subsequent releases (minimum two releases will include user research per requirements). This initial release establishes the foundation. Our next cycle will conduct comprehensive user studies documenting Critical User Journeys (CUJ) with real students, usability testing, feature effectiveness metrics, and engagement analysis with classmates, instructors, and external users.

---

**Release Date**: October 15, 2025 | **Version**: 1.0.0 | **Word Count**: ~750
