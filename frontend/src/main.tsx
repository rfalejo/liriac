import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { LibraryDataProvider } from "./features/library/LibraryDataProvider";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <LibraryDataProvider>
      <App />
    </LibraryDataProvider>
  </React.StrictMode>,
);
