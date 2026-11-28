import Background from "./components/Background";
import Navigation from "./components/Navigation";
import Hero from "./components/Hero";
import "./App.css";

function App() {
  return (
    <>
      <Background />
      <Navigation />
      <main className="main-content">
        <Hero />
      </main>
    </>
  );
}

export default App;