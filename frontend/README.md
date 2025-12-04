# Achievo Frontend



## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Chrome browser (for extension testing)
- Backend server running (see [backend README](../backend/README.md))

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/dcsil/achievo-app.git
   cd achievo-app/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

### Environment Setup

Create or update `src/config/api.ts` to set the environment:

- **Local Development**:
  ```typescript
  const ENVIRONMENT = 'local';
  ```

- **Production**:
  ```typescript
  const ENVIRONMENT = 'production';
  ```

## Development

1. Start the backend server (see [backend README](../backend/README.md))

2. For quick changes and development, start the development server:
   ```bash
   npm start
   ```

3. For Chrome extension development, build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
- Toggle on Developer mode:
<img width="966" height="164" alt="image" src="https://github.com/user-attachments/assets/df438572-91e6-49d5-b558-aeca151c0cef" />

- Click on Load Unpacked:
<img width="959" height="161" alt="image" src="https://github.com/user-attachments/assets/9055066d-63b4-4cd2-98ad-d74381c88d36" />

- Unpack the `build` folder in frontend:
<img width="581" height="341" alt="image" src="https://github.com/user-attachments/assets/0b4fb6cf-1231-4fb1-af9f-5cc9f9a1f6da" />

- Now you can see your extension in the extensions tab:
<img width="317" height="196" alt="image" src="https://github.com/user-attachments/assets/7e0518f8-e666-4777-aff0-7f2e4d1dd249" />

## Building for Production

To create a production build:

```bash
npm run build
```

This will generate optimized files in the `build` directory, ready for deployment or extension packaging.

## Testing

Run the test suite with coverage:

```bash
npm run test:coverage
```

For continuous testing during development:

```bash
npm test
```

Note: Ensure `ENVIRONMENT = 'local'` in `src/config/api.ts` when running tests.

## Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── api-contexts/       # API integration contexts
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── utils/             # Utility functions
│   ├── config/            # Configuration files
│   └── assets/            # Images and icons
├── build/                 # Production build output
├── coverage/              # Test coverage reports
└── package.json           # Dependencies and scripts
```

## Technologies Used

- **React**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Chrome Extension API**: Browser integration