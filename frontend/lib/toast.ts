import { toast as sonnerToast } from "sonner"

export const toast = {
    success: (message: string, description?: string) => {
        sonnerToast.success(message, { description })
    },
    error: (message: string, description?: string) => {
        sonnerToast.error(message, { description })
    },
    warning: (message: string, description?: string) => {
        sonnerToast.warning(message, { description })
    },
    info: (message: string, description?: string) => {
        sonnerToast.info(message, { description })
    },
    promise: <T,>(
        promise: Promise<T>,
        messages: {
            loading: string
            success: string
            error: string
        }
    ) => {
        return sonnerToast.promise(promise, messages)
    },
}
