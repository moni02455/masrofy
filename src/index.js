import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// محاكاة localStorage للاستخدام في GitHub Pages
if (!window.storage) {
  window.storage = {
    data: {},
    set: function(key, value) {
      this.data[key] = value;
      localStorage.setItem(key, value);
      return Promise.resolve();
    },
    get: function(key) {
      const value = localStorage.getItem(key);
      if (value) {
        this.data[key] = { value };
        return Promise.resolve({ value });
      }
      return Promise.resolve(null);
    },
    remove: function(key) {
      delete this.data[key];
      localStorage.removeItem(key);
      return Promise.resolve();
    }
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
