import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white">
      <div className="mb-10 rounded-lg bg-blue-600 p-6 text-center shadow-xl border-4 border-yellow-400">
        <h1 className="text-4xl font-black uppercase tracking-widest text-yellow-300">
          Tailwind Test: ON!
        </h1>
        <p className="mt-2 font-medium">
          Se você vê este fundo azul e borda amarela, a configuração funcionou.
        </p>
      </div>

      <section
        id="center"
        className="flex flex-col items-center justify-center gap-6"
      >
        <div className="hero flex items-center justify-center gap-4 bg-slate-800 p-6 rounded-2xl shadow-inner">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img
            src={reactLogo}
            className="animate-spin-slow w-16"
            alt="React logo"
          />
          <img src={viteLogo} className="w-16" alt="Vite logo" />
        </div>

        <div className="text-center">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Get started
          </h1>
          <p className="mt-4 text-slate-400">
            Edit{" "}
            <code className="bg-slate-700 px-2 py-1 rounded text-pink-400">
              src/App.tsx
            </code>{" "}
            and save to test <code>HMR</code>
          </p>
        </div>

        <button
          type="button"
          className="mt-4 px-8 py-3 bg-indigo-500 hover:bg-indigo-600 active:scale-95 transition-all rounded-full font-bold shadow-lg shadow-indigo-500/50"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section>

      <div className="my-12 h-px bg-slate-700 w-full"></div>

      <section
        id="next-steps"
        className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
      >
        <div
          id="docs"
          className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-cyan-500 transition-colors"
        >
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-cyan-400">📚</span> Documentation
          </h2>
          <p className="text-slate-400 mt-2">Your questions, answered</p>
          <ul className="mt-4 space-y-2">
            <li>
              <a
                href="https://vite.dev/"
                target="_blank"
                className="text-blue-400 hover:underline flex items-center gap-2"
              >
                Explore Vite
              </a>
            </li>
            <li>
              <a
                href="https://react.dev/"
                target="_blank"
                className="text-blue-400 hover:underline flex items-center gap-2"
              >
                Learn more
              </a>
            </li>
          </ul>
        </div>

        <div
          id="social"
          className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-pink-500 transition-colors"
        >
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-pink-500">🌐</span> Connect with us
          </h2>
          <p className="text-slate-400 mt-2">Join the Vite community</p>
          <ul className="mt-4 grid grid-cols-2 gap-2">
            <li>
              <a href="#" className="hover:text-cyan-400 transition-colors">
                GitHub
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-blue-400 transition-colors">
                Discord
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-sky-400 transition-colors">
                X.com
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-purple-400 transition-colors">
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <section id="spacer" className="h-20"></section>
    </div>
  );
}

export default App;
