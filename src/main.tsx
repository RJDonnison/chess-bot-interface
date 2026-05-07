import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { Toaster } from "sonner";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <Toaster
      offset={0}
      visibleToasts={1}
      position="top-center"
      toastOptions={{
        classNames: {
          error: "!bg-red-900 !border-red-700 !text-red-100",
          description: "!text-red-300",
        },
      }}
    />
  </StrictMode>,
);
