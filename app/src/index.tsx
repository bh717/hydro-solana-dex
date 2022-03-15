import { Suspense, lazy } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";

// ** Toast
import { ToastContainer } from "react-toastify";

// ** Spinner (Splash Screen)
import FallbackSpinner from "./components/spinner/fallbackSpinner";

// ** React Toastify
import "react-toastify/scss/main.scss";

// ** Core styles
import "./assets/styles/style.scss";

import reportWebVitals from "./reportWebVitals";

// ** Lazy load app
const LazyApp = lazy(() => import("./App"));

ReactDOM.render(
  <BrowserRouter>
    <Suspense fallback={<FallbackSpinner />}>
      <LazyApp />
      <ToastContainer position="top-right" autoClose={5000} newestOnTop />
    </Suspense>
  </BrowserRouter>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
