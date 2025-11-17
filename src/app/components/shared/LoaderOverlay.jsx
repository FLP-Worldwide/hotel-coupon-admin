"use client";

import { useEffect, useState } from "react";
import { Spin } from "antd";
import { loading } from "../../lib/loading";

export default function LoaderOverlay() {
    const [active, setActive] = useState(loading.isLoading);
    const [mounted, setMounted] = useState(false); // optional anti-flicker

    useEffect(() => {
        return loading.subscribe((isLoading) => setActive(isLoading));
    }, []);

    // Show only if loading lasts >150ms (prevents quick flash)
    useEffect(() => {
        if (!active) {
            setMounted(false);
            return;
        }
        const id = setTimeout(() => setMounted(true), 150);
        return () => clearTimeout(id);
    }, [active]);

    return mounted ? <Spin fullscreen size="large" /> : null;
}
