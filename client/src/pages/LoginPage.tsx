import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { KeyRound, Loader2, Mail, User, UserRoundPlus } from "lucide-react";
import { useAuth } from "../context/authContext.tsx";
import { useNavigation } from "../hooks/useNavigation";
import { authApi } from "../services/api";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRememberMe, setRemember] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSetupOpen, setSetupOpen] = useState(false);
  const [isCheckingSetup, setCheckingSetup] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const { forwardTo } = useNavigation();
  const { login } = useAuth();

  useEffect(() => {
    const checkBootstrapStatus = async () => {
      try {
        const data = await authApi.getBootstrapStatus();
        setSetupOpen(Boolean(data.isOpen));
      } catch (error) {
        console.error("Bootstrap Status Error:", error);
        setSetupOpen(false);
      } finally {
        setCheckingSetup(false);
      }
    };

    checkBootstrapStatus();
  }, []);

  const getErrorMessage = (error: unknown, fallback: string) => {
    return error instanceof Error ? error.message : fallback;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Tüm alanların doldurulması zorunludur !", {
        style: { border: "2px solid", padding: "16px" },
      });
      return;
    }

    setSubmitting(true);

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
    } catch (error: unknown) {
      console.error("Login Error:", error);
      toast.error(getErrorMessage(error, "Sunucuya bağlanılamadı!"), {
        style: { border: "2px solid", padding: "16px" },
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterFirstAdmin = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    if (!firstName || !lastName || !email || !password) {
      toast.error("Tüm alanların doldurulması zorunludur !", {
        style: { border: "2px solid", padding: "16px" },
      });
      return;
    }

    setSubmitting(true);

    try {
      const data = await authApi.registerFirstAdmin({
        email,
        password,
        firstName,
        lastName,
      });

      if (data.success) {
        setSetupOpen(false);
        login(data.user);
        toast.success("İlk admin hesabı oluşturuldu.", {
          style: { border: "2px solid", padding: "16px" },
        });
        forwardTo("Ana sayfa", "/main");
      }
    } catch (error: unknown) {
      console.error("First Admin Register Error:", error);
      setSetupOpen(false);
      toast.error(getErrorMessage(error, "İlk kurulum tamamlanamadı!"), {
        style: { border: "2px solid", padding: "16px" },
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isCheckingSetup) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-gray-200 px-4">
        <Loader2 className="h-10 w-10 animate-spin text-gray-900" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-gray-200 px-4">
      <div className="w-full max-w-sm" id="login-form">
        <div className="rounded-xl border-3 border-b-5 border-gray-900 bg-white p-8">
          <h1 className="mb-6 text-center text-4xl text-gray-900">
            {isSetupOpen ? "İlk Kurulum" : "Giriş Yap"}
          </h1>

          {isSetupOpen ? (
            <form
              className="flex flex-col gap-6 text-lg"
              onSubmit={handleRegisterFirstAdmin}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="relative flex items-center">
                  <User className="absolute left-3" size={20} strokeWidth={2} />
                  <input
                    type="text"
                    name="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ad"
                    className="w-full rounded-lg border-2 border-b-4 border-gray-900 p-3 pl-10 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>

                <div className="relative flex items-center">
                  <User className="absolute left-3" size={20} strokeWidth={2} />
                  <input
                    type="text"
                    name="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Soyad"
                    className="w-full rounded-lg border-2 border-b-4 border-gray-900 p-3 pl-10 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>
              </div>

              <div className="relative flex items-center text-center">
                <Mail className="absolute left-3" size={20} strokeWidth={2} />
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-posta"
                  className="w-full rounded-lg border-2 border-b-4 border-gray-900 p-3 pl-10 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
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
                  className="w-full rounded-lg border-2 border-b-4 border-gray-900 p-3 pl-10 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
              </div>

              <button
                className="flex items-center justify-center gap-2 rounded-lg border-2 border-gray-900 bg-gray-800 p-3 text-lg text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <UserRoundPlus className="h-5 w-5" />
                )}
                Admin Hesabını Oluştur
              </button>
            </form>
          ) : (
            <form
              className="flex flex-col gap-7 text-lg"
              onSubmit={handleSubmit}
            >
              <div className="relative flex items-center text-center">
                <Mail className="absolute left-3" size={20} strokeWidth={2} />

                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-posta"
                  className="w-full rounded-lg border-2 border-b-4 border-gray-900 p-3 pl-10 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
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
                  className="w-full rounded-lg border-2 border-b-4 border-gray-900 p-3 pl-10 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
              </div>

              <div className="flex w-full items-center justify-start">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={isRememberMe}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-5 w-5"
                />
                <label className="ml-2 text-center text-gray-700">
                  Beni Hatırla
                </label>
              </div>

              <button
                className="flex items-center justify-center gap-2 rounded-lg border-2 border-gray-900 bg-gray-800 p-3 text-lg text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-500"
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="h-5 w-5 animate-spin" />
                )}
                Giriş Yap
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
