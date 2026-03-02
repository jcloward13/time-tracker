import React from "react";
import { createRoot } from "react-dom/client";
import TimeTracker from "../time-tracker.jsx";

// localStorage-backed storage shim for window.storage
window.storage = {
  get: async (key) => {
    const value = localStorage.getItem(key);
    return value !== null ? { value } : null;
  },
  set: async (key, value) => {
    localStorage.setItem(key, value);
  },
  list: async (prefix) => {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(prefix));
    return { keys };
  },
};

createRoot(document.getElementById("root")).render(<TimeTracker />);
