import { ArrowRightFromLine } from "lucide-react";
import { useNavigation } from "../hooks/useNavigation";

interface ViewAllButtonProps {
  label: string;
  path: string;
}

const ViewAllButton = ({ label, path }: ViewAllButtonProps) => {
  const { forwardTo } = useNavigation();

  return (
    <div className="mt-4 flex justify-end">
      <button
        onClick={() => forwardTo(label, path)}
        className="text-blue-600 hover:text-blue-700 cursor-pointer text-sm font-medium flex items-center gap-1"
      >
        Tümünü Görüntüle
        <ArrowRightFromLine className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ViewAllButton;
