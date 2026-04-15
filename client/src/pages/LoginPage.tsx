import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Mail, KeyRound } from "lucide-react";
import { useAuth } from "../context/authContext.tsx";
import { useNavigation } from "../hooks/useNavigation";
import { authApi } from "../services/api";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRememberMe, setRemember] = useState(false);
  const { forwardTo } = useNavigation();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Tüm alanların doldurulması zorunludur !", {
        style: { border: "2px solid", padding: "16px" },
      });
      return;
    }

    try {
      const data = await authApi.login({ email, password, isRememberMe });

      if (data.success) {
        login(data.user);
        forwardTo("Ana sayfa", "/main");
      } else {
        toast.error(data.message || "Giriş yapılamadı!", {
          style: { border: "2px solid", padding: "16px" },
        });
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      toast.error(error.message || "Sunucuya bağlanılamadı!", {
        style: { border: "2px solid", padding: "16px" },
      });
    }
  };

  return (
    <div className="flex w-screen h-screen bg-gray-200">
      <div className="flex justify-between items-center ml-12 gap-6 flex-1 w-full">
        <div className="flex  w-120  flex-col" id={"login-form"}>
          <div className="p-8 rounded-xl border-b-5 border-3 bg-white border-gray-900">
            <h1 className="text-4xl text-gray-900 mb-6 text-center">
              Giriş Yap
            </h1>
            <form
              className="flex flex-col gap-7 text-lg"
              onSubmit={handleSubmit}
            >
              <div className="relative flex items-center text-center">
                <Mail className="absolute left-3 " size={20} strokeWidth={2} />

                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-posta"
                  className="w-full p-3 pl-10 rounded-lg border-2 border-gray-900 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 border-b-4"
                />
              </div>
              <div className="relative flex items-center">
                <KeyRound
                  className="absolute left-3"
                  size={20}
                  strokeWidth={2}
                />

                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Şifre"
                  className="w-full p-3 pl-10 rounded-lg border-2 border-gray-900 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 border-b-4"
                />
              </div>

              <div className="justify-start flex items-center w-full">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={isRememberMe}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-5 h-5"
                />
                <label className="ml-2 text-gray-700 text-center">
                  Beni Hatırla
                </label>
              </div>

              <button className="p-3 rounded-lg bg-gray-800 text-white text-lg border-2 border-gray-900 hover:bg-gray-700 transition">
                Giriş Yap
              </button>
              <p className="text-center text-sm text-gray-600">
                <button
                  type="button"
                  className="underline underline-offset-3 text-lg text-black"
                  onClick={() => navigate("/register")}
                >
                  Şifremi Unuttum
                </button>
              </p>
            </form>
          </div>
        </div>
        <div className="w-1 h-[25%] rounded-full bg-gray-400"></div>
        <div className="w-full h-full bg-black"></div>
      </div>
    </div>
  );
};

export default LoginPage;
