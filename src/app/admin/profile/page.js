"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, Avatar, Tag, Spin, Alert, Button } from "antd";
import { UserOutlined } from "@ant-design/icons";

export default function ProfilePage() {
    const { data: session } = useSession();
    const token = session?.accessToken ?? null;

    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!token) return;

        const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
        setLoading(true);
        fetch(`${apiBase}/admin/me`, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
        })
            .then(async (res) => {
                if (!res.ok) throw new Error(await res.text());
                const payload = await res.json();
                setAdmin(payload?.data ?? payload);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [token]);

    const initials = (name = "") =>
        name
            ? name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
            : "A";

    return (
        <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <Card
                    className="shadow-xl rounded-2xl overflow-hidden"
                    style={{ body:{padding: "2rem" }}}
                >
                    {loading && (
                        <div className="flex justify-center py-10">
                            <Spin size="large" />
                        </div>
                    )}

                    {error && (
                        <Alert
                            message="Error loading profile"
                            description={error}
                            type="error"
                            showIcon
                        />
                    )}

                    {!loading && !error && admin && (
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                            {/* Left side avatar + name */}
                            <div className="flex flex-col items-center md:items-start gap-4">
                                <Avatar
                                    size={96}
                                    icon={<UserOutlined />}
                                    className="bg-blue-500"
                                >
                                    {initials(admin?.name ?? admin?.email)}
                                </Avatar>
                                <div className="text-center md:text-left">
                                    <h2 className="text-2xl font-semibold text-gray-800">
                                        {admin?.name ?? "—"}
                                    </h2>
                                    <p className="text-gray-500">{admin?.email}</p>
                                    <Tag
                                        color={admin?.role === "admin" ? "green" : "blue"}
                                        className="mt-2"
                                    >
                                        {admin?.role}
                                    </Tag>
                                </div>
                            </div>

                            {/* Right side details */}
                            <div className="flex-1 w-full">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                    <div>
                                        <p className="text-gray-500 text-sm">Name</p>
                                        <p className="font-medium text-gray-800">
                                            {admin?.name ?? "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-sm">Email</p>
                                        <p className="font-medium text-gray-800">
                                            {admin?.email ?? "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-sm">Role</p>
                                        <p className="font-medium text-gray-800">
                                            {admin?.role ?? "—"}
                                        </p>
                                    </div>
                                    {/* <div>
                                        <p className="text-gray-500 text-sm">Created At</p>
                                        <p className="font-medium text-gray-800">
                                            {admin?.createdAt
                                                ? new Date(admin.createdAt).toLocaleDateString()
                                                : "—"}
                                        </p>
                                    </div> */}
                                </div>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
