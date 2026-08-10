import { useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function App() {
  const [email, setEmail] = useState<string | null>(null);

  if (!email) {
    return <Login onLogin={setEmail} />;
  }

  return <Dashboard email={email} onLogout={() => setEmail(null)} />;
}

export default App;
