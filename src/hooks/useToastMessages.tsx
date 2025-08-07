import { toast } from "sonner";
import { ShieldX, CheckCircle, Info } from "lucide-react";
import { JSX } from "react";

interface ToastOptions {
  duration?: number;
}

export const showSuccess = (
  description?: string | null,
  options?: ToastOptions,
) => {
  toast.success("Success", {
    description,
    duration: options?.duration || 3000,
    icon: (
      <CheckCircle className={"text-orange-400 h-[18px]"} />
    ) as JSX.Element,
  });
};

export const showError = (
  title: string,
  description: string,
  options?: ToastOptions,
) => {
  toast.error(title, {
    description,
    duration: options?.duration || 3000,
    icon: (<ShieldX className={"text-red-500 h-[20px]"} />) as JSX.Element,
  });
};

export const showWarning = (message: string, options?: ToastOptions) => {
  toast.warning(message, {
    duration: options?.duration || 3000,
  });
};

export const showInfo = (message: string, options?: ToastOptions) => {
  toast.info(message, {
    duration: options?.duration || 3000,
    icon: (<Info className={"text-orange-400 h-[18px]"} />) as JSX.Element,
  });
};
