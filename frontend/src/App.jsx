import {BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom"
import {AuthProvider, useAuth} from "./context/AuthContext.jsx"
import LoginPage from "./pages/LoginPage.jsx"
import SignupPage from "./pages/SignupPage.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import GroupPage from "./pages/GroupPage.jsx"
import InvitePage from "./pages/InvitePage.jsx"
import {SocketProvider} from "./context/SocketContext.jsx"

const PrivateRoute = ({children}) => {
  const {user, loading} = useAuth()
  if(loading){
    return <div className="text-white text-center">Loading...</div>
  }
  return user ? children : <Navigate to="/login"/>
}

const InviteRoute = ({children}) => {
  const {user, loading} = useAuth();
  if(loading) return <div className="text-white text-center">Loading...</div>;
  
  if (user) {
    return children;
  } else {
    // If user is not logged in, redirect to login page. The login page can
    // then redirect back here after a successful login.
    return <Navigate to="/login" state={{ from: window.location.pathname }} />;
  }
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage/>}/>
          <Route path="/signup" element={<SignupPage/>}/>
          <Route path="/" element={<Navigate to="/dashboard"/>}/>
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard/>
              </PrivateRoute>
            }
          />
          <Route
            path="/groups/:groupId"
            element={
              <PrivateRoute>
                <GroupPage/>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App;