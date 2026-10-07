import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const usuarioSalvo = localStorage.getItem("usuario");

  if (!usuarioSalvo) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;