import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Discover from "./pages/Discover";
import Events from "./pages/Events";
import Messages from "./pages/Messages";
import Admin from "./pages/Admin";
import DeepLinkHandler from "./components/DeepLinkHandler";
import { AuthProvider } from "./context/AuthContext";
import { ModalProvider } from "./context/ModalContext";
import { ToastProvider } from "./context/ToastContext";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ModalProvider>
          <DeepLinkHandler />
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/events" element={<Events />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
          <Footer />
        </ModalProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
