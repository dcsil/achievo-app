# README for Frontend

## Environment Configuration

### Local Development:
- Set `ENVIRONMENT = 'local'` in `src/config/api.ts`

### Production Deployment:
- Set `ENVIRONMENT = 'production'` in `src/config/api.ts`

### To run the Chrome Extension:

- Run the backend
- In a new terminal, cd into frontend and run ``npm install``
- Then, run ``npm run build``
- In your Chrome browser, go to `chrome://extensions` and follow these steps:
1. Toggle on Developer mode:
<img width="966" height="164" alt="image" src="https://github.com/user-attachments/assets/df438572-91e6-49d5-b558-aeca151c0cef" />

2. Click on Load Unpacked:
<img width="959" height="161" alt="image" src="https://github.com/user-attachments/assets/9055066d-63b4-4cd2-98ad-d74381c88d36" />

3. Unpack the `build` folder in frontend:
<img width="581" height="341" alt="image" src="https://github.com/user-attachments/assets/0b4fb6cf-1231-4fb1-af9f-5cc9f9a1f6da" />

4. Now you can see your extension in the extensions tab:
<img width="317" height="196" alt="image" src="https://github.com/user-attachments/assets/7e0518f8-e666-4777-aff0-7f2e4d1dd249" />


### To test front end:

- run ``npm run test:coverage``
Note: set `ENVIRONMENT = 'local'` in `src/config/api.ts` for testing.

