"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Something went wrong!</h2>
            <p className="text-muted-foreground max-w-[500px]">
                We encountered an error while loading this page. Please try refreshing or
                contact support if the problem persists.
            </p>
            <div className="flex gap-4 mt-4">
                <Button onClick={() => reset()} variant="default">
                    Try again
                </Button>
                <Button onClick={() => window.location.reload()} variant="outline">
                    Refresh Page
                </Button>
            </div>
        </div>
    );
}
