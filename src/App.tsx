import './App.css';
import ProspectFinder from './components/ProspectFinder';
import { PWAInstaller } from './components/PWAInstaller';

function App() {
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <ProspectFinder />
      <PWAInstaller />
    </div>
  );
}

export default App;
