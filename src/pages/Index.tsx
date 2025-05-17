import { Navigate } from "react-router-dom";

export default function Index() {
  // Redirect to login page
  return <Navigate to="/login" replace />;
}