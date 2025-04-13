# Hot Reloading

This guide explains how to set up hot reloading for Flow Browser development.

## Prerequisites

- Ensure you have installed all the dependencies as mentioned in the main [CONTRIBUTING.md](../../CONTRIBUTING.md).
- Make sure port 5173 is available on your system.

## Setting Up Hot Reloading

Hot reloading allows you to see your changes in real-time without manually restarting the application. To enable hot reloading:

1. Make sure port 5173 is empty and ready.

2. Run the development server in a separate terminal:

   ```bash
   bun run dev:server
   ```

3. In another terminal, start Flow Browser:
   ```bash
   bun run start
   ```

## Troubleshooting

- If you encounter errors about port 5173 being in use, find and terminate the process using that port.
- For macOS/Linux:
  ```bash
  lsof -i :5173
  kill -9 <PID>
  ```
- For Windows:
  ```cmd
  netstat -ano | findstr :5173
  taskkill /PID <PID> /F
  ```
