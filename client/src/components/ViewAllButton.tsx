import { ArrowRightFromLine } from "lucide-react";
import { useNavigation } from "../hooks/useNavigation";

interface ViewAllButtonProps {
  label: string;
  path: string;
  buttonText?: string;
}

const ViewAllButton = ({
  label,
  path,
  buttonText = "Tümünü Görüntüle",
}: ViewAllButtonProps) => {
  const { forwardTo } = useNavigation();

  return (
    <div className="mt-4 flex justify-end">
      <button
        onClick={() => forwardTo(label, path)}
        className="text-blue-600 truncate hover:text-blue-700 cursor-pointer text-sm font-medium flex items-center gap-1"
      >
        {buttonText}
        <ArrowRightFromLine className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ViewAllButton;
