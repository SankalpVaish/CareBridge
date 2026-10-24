import { Routes, Route } from 'react-router-dom'
import Layout from './Layout.jsx'
import Home from './Home.jsx'
import CarePage from '../features/care/CarePage.jsx'
import FindPage from '../features/find/FindPage.jsx'
import CoordinatePage from '../features/coordinate/CoordinatePage.jsx'
import SignIn from './SignIn.jsx'
import SignUp from './SignUp.jsx'
import RequireAuth from './RequireAuth.jsx'
import NotFound from './NotFound.jsx'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/care" element={<CarePage />} />
        <Route path="/find" element={<FindPage />} />
        {/* Coordinate is now dynamic and role-aware — requires sign-in. */}
        <Route
          path="/coordinate"
          element={
            <RequireAuth>
              <CoordinatePage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}
