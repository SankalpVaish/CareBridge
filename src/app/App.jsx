import { Routes, Route } from 'react-router-dom'
import Layout from './Layout.jsx'
import Home from './Home.jsx'
import CarePage from '../features/care/CarePage.jsx'
import FindPage from '../features/find/FindPage.jsx'
import CoordinatePage from '../features/coordinate/CoordinatePage.jsx'
import NotFound from './NotFound.jsx'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/care" element={<CarePage />} />
        <Route path="/find" element={<FindPage />} />
        <Route path="/coordinate" element={<CoordinatePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}
