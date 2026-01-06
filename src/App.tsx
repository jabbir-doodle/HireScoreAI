import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from './store/useStore';
import {
  LandingScreen,
  JobScreen,
  UploadScreen,
  ScreeningScreen,
  ResultsScreen,
  SettingsScreen
} from './components/screens';

function App() {
  const currentScreen = useStore((s) => s.currentScreen);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'landing':
        return <LandingScreen />;
      case 'job':
        return <JobScreen />;
      case 'upload':
        return <UploadScreen />;
      case 'screening':
        return <ScreeningScreen />;
      case 'results':
        return <ResultsScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <LandingScreen />;
    }
  };

  return (
    <div className="min-h-screen min-h-dvh w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default App;
