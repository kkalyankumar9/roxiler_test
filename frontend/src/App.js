import "./App.css";
import ProductsComp from "./components/productComp";

function App() {
  return (
    <div>
      <p className="font-bold text-center text-orange-300 text-4xl">
        Transactions Data
      </p>

      <ProductsComp />
    </div>
  );
}

export default App;
