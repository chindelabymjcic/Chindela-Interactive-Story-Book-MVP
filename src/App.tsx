import { Routes, Route, useLocation } from 'react-router'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from '@/components/ui/sonner'
import PageTransition from './components/PageTransition'
import Home from './pages/Home'
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import StoryBrowser from './pages/StoryBrowser'
import StoryReader from './pages/StoryReader'
import Diary from './pages/Diary'
import Subscriptions from './pages/Subscriptions'
import Notifications from './pages/Notifications'
import ChildLogin from './pages/ChildLogin'
import ChildDashboard from './pages/ChildDashboard'
import ChildReader from './pages/ChildReader'
import ChildDiary from './pages/ChildDiary'
import AccountSecurity from './pages/AccountSecurity'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import Donate from './pages/Donate'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  const location = useLocation()

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <AnimatePresence mode="wait" initial={false}>
        <PageTransition>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/child-login" element={<ChildLogin />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/donate" element={<Donate />} />

            <Route element={<ProtectedRoute variant="parent" />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/stories" element={<StoryBrowser />} />
              <Route path="/stories/:id" element={<StoryReader />} />
              <Route path="/diary" element={<Diary />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/account-security" element={<AccountSecurity />} />
            </Route>

            <Route element={<ProtectedRoute variant="admin" />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            <Route element={<ProtectedRoute variant="child" />}>
              <Route path="/child" element={<ChildDashboard />} />
              <Route path="/child/read/:id" element={<ChildReader />} />
              <Route path="/child/diary" element={<ChildDiary />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </AnimatePresence>
    </>
  )
}
