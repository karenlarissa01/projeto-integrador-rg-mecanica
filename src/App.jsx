import { Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import MinhaConta from "./pages/MinhaConta";
import MeusAgendamentos from "./pages/MeusAgendamentos";
import MeusVeiculos from "./pages/MeusVeiculos";
import CadastrarVeiculo from "./pages/CadastrarVeiculo";
import Agendamento from "./pages/Agendamento";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        <Route
          path="/minha-conta"
          element={
            <ProtectedRoute>
              <MinhaConta />
            </ProtectedRoute>
          }
        />

        <Route
          path="/meus-agendamentos"
          element={
            <ProtectedRoute>
              <MeusAgendamentos />
            </ProtectedRoute>
          }
        />

        <Route
          path="/meus-veiculos"
          element={
            <ProtectedRoute>
              <MeusVeiculos />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cadastrar-veiculo"
          element={
            <ProtectedRoute>
              <CadastrarVeiculo />
            </ProtectedRoute>
          }
        />

        <Route
          path="/agendamento"
          element={
            <ProtectedRoute>
              <Agendamento />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;