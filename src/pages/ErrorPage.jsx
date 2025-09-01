// components/ErrorPage.jsx
import { useRouteError, Link } from "react-router-dom"

export function ErrorPage() {
  const error = useRouteError()
  return (
    <div className="container-fluid min-vh-100 bg-info-subtle d-flex flex-column align-items-center justify-content-center p-5">
      <div className="w-50 rounded-5 border border-black border-2 bg-light d-flex flex-column align-items-center justify-content-center px-3 pt-3 pb-4 gap-3">
        <h1 className="text-center">Oops!</h1>
        <p className="text-center text-break fw-medium">Sorry, an unexpected error has occurred.</p>
        <p>
          <i className="text-center text-break fw-medium">Error Type: {error?.statusText || error?.message || "Page not found"}</i>
        </p>
        {error?.status === 404 && (
          <p className="text-center text-break fw-medium">The page you're looking for doesn't exist!</p>
        )}
        <Link className="btn rounded-5 fw-bold custom-hover text-break p-3" style={{ backgroundColor: "#9e42f5", color: "white" }} type="button" to="/">Go back to Home</Link>
      </div>
    </div>
  )
}
