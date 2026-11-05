import axios from "axios";

const api = axios.create({
    // Same machine that served the page, so it also works from a phone
    baseURL: import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`,
});

export function clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("first_login");
}

// Turns a FastAPI error into one sentence that can be shown to the user
export function getApiError(err, fallback = "Something went wrong. Please try again.") {
    const detail = err.response?.data?.detail;

    if (typeof detail === "string") {
        return detail;
    }

    if (Array.isArray(detail) && detail.length > 0) {
        const field = detail[0].loc?.[detail[0].loc.length - 1];
        const message = detail[0].msg?.replace("Value error, ", "");
        return field ? `${String(field).replaceAll("_", " ")}: ${message}` : message;
    }

    if (!err.response) {
        return "Cannot reach the server. Check that the backend is running.";
    }

    return fallback;
}

api.interceptors.request.use((config) => {

    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(

    (response) => response,

    (error) => {

        // A failed sign-in also returns 401, and the login page shows that itself
        const isLoginRequest = error.config?.url === "/login";

        if (error.response?.status === 401 && !isLoginRequest) {

            clearSession();

            window.location.href = "/login";
        }

        if (error.response?.data?.detail === "Password change required") {

            localStorage.setItem("first_login", "true");

            window.location.href = "/change-password";
        }

        return Promise.reject(error);
    }

);

export default api;
