
// This file re-exports the toast functionality from the UI component
// to allow for a cleaner import path in consumer components
import { useToast as useToastUI, toast as toastUI } from "@/components/ui/use-toast";

export const useToast = useToastUI;
export const toast = toastUI;
