import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children, roles }) {

    const location = useLocation();

    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const mustChangePassword = localStorage.getItem("first_login") === "true";

    if (mustChangePassword && location.pathname !== "/change-password") {
        return <Navigate to="/change-password" replace />;
    }

    if (roles && !roles.includes(localStorage.getItem("role"))) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;
