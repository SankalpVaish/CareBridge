import { Routes, Route } from 'react-router-dom'
import Layout from './Layout.jsx'
import Home from './Home.jsx'
import CarePage from '../features/care/CarePage.jsx'
import FindPage from '../features/find/FindPage.jsx'
import SafetyPage from '../features/find/SafetyPage.jsx'
import ProviderPage from '../features/find/ProviderPage.jsx'
import CoordinatePage from '../features/coordinate/CoordinatePage.jsx'
import SignIn from './SignIn.jsx'
import SignUp from './SignUp.jsx'
import RequireAuth from './RequireAuth.jsx'
import NotFound from './NotFound.jsx'
import { CarePreferencesProvider } from '../features/care/carePreferences.jsx'
import { demoPatient } from '../data/mockData.js'

export default function App() {
  // Language and easy-read are app-wide, so the choice on Home applies everywhere.
  return (
    <CarePreferencesProvider patient={demoPatient}>
      <AppRoutes />
    </CarePreferencesProvider>
  )
}

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/care" element={<CarePage />} />
        <Route path="/find" element={<FindPage />} />
        <Route path="/find/safety" element={<SafetyPage />} />
        <Route path="/find/provider/:id" element={<ProviderPage />} />
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
