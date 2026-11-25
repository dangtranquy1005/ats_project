import React from 'react';
import { useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ToastContainer from './components/ToastContainer';

// Screens
import AuthScreen from './components/screens/AuthScreen';
import JdScreen from './components/screens/JdScreen';
import UploadScreen from './components/screens/UploadScreen';
import RankingScreen from './components/screens/RankingScreen';
import ReportScreen from './components/screens/ReportScreen';
import SkillsScreen from './components/screens/SkillsScreen';
import AccountScreen from './components/screens/AccountScreen';
import ErrorsScreen from './components/screens/ErrorsScreen';

// Modals
import ModalWeights from './components/modals/ModalWeights';
import ModalCreateJd from './components/modals/ModalCreateJd';
import ModalSkillPick from './components/modals/ModalSkillPick';
import ModalSkillForm from './components/modals/ModalSkillForm';
import ModalAlias from './components/modals/ModalAlias';
import ModalCvDetail from './components/modals/ModalCvDetail';
import ModalConfirm from './components/modals/ModalConfirm';

export default function App() {
  const { activeScreen } = useApp();
  const isAuth = activeScreen === 'screen-auth';

  return (
    <div className="flex flex-col h-screen overflow-hidden select-none bg-[#F8FAFC]">
      {/* Main Application Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {isAuth ? (
          <main className="flex-1 overflow-hidden p-3 flex flex-col">
            <AuthScreen />
          </main>
        ) : (
          <>
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Right Container */}
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-[#F8FAFC]">
              {/* Topbar */}
              <Navbar />

              {/* Workspace Main View */}
              <main className="flex-1 min-w-0 overflow-hidden p-3.5 flex flex-col">
                {activeScreen === 'screen-jd' && <JdScreen />}
                {activeScreen === 'screen-upload' && <UploadScreen />}
                {activeScreen === 'screen-ranking' && <RankingScreen />}
                {activeScreen === 'screen-report' && <ReportScreen />}
                {activeScreen === 'screen-skills' && <SkillsScreen />}
                {activeScreen === 'screen-account' && <AccountScreen />}
                {activeScreen === 'screen-errors' && <ErrorsScreen />}
              </main>
            </div>
          </>
        )}
      </div>

      {/* 3. Global Modals */}
      <ModalWeights />
      <ModalCreateJd />
      <ModalSkillPick />
      <ModalSkillForm />
      <ModalAlias />
      <ModalCvDetail />
      <ModalConfirm />

      {/* 4. Global Toast System */}
      <ToastContainer />
    </div>
  );
}
