"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { loading } from "../../lib/loading";
/**
 * Triggers loader briefly on route changes.
 * If API calls are in-flight, the overlay stays until they finish.
 */
export default function RouteLoader() {
    const pathname = usePathname();
    const timer = useRef(null);

    useEffect(() => {
        loading.start();
        timer.current = window.setTimeout(() => {
            loading.stop();
        }, 400); // adjust 300–500ms to taste

        return () => {
            if (timer.current) window.clearTimeout(timer.current);
        };
    }, [pathname]);

    return null;
}
