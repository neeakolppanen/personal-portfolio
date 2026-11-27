import Background from "./components/Background";
import Navigation from "./components/Navigation";
import "./App.css";

function App() {
  return (
    <>
      <Background />
      <main className="main-content">
        <Navigation />
      </main>
    </>
  );
}

export default App;