import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export const useNavigation = () => {
  const navigate = useNavigate();

  const forwardTo = (label: string, path: string) => {
    const loadingToast = toast.loading(
      `${label} sayfasına yönlendiriliyorsunuz...`,
      {
        style: {
          border: "2px solid",
          padding: "16px",
        },
      },
    );
    setTimeout(() => {
      toast.success("Başarıyla yönlendirildi!", {
        id: loadingToast,
        style: {
          border: "2px solid",
          padding: "16px",
        },
      });
      navigate(path);
    }, 500);
  };

  return { forwardTo };
};
