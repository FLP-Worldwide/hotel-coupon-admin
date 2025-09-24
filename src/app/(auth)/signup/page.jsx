"use client";
import { useAuth } from "@/app/components/hooks/useAuth";
import { Form, Input, Button, Typography, Checkbox, Divider } from "antd";
import { useState } from "react";
import { MailOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function SignupPage() {
    const [form] = Form.useForm();
    const { signup, loading } = useAuth();
    const [submitting, setSubmitting] = useState(false);

    const passwordRules = [
        { required: true, message: "Please enter a password" },
        {
            pattern:
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&^()[\]{}_\-+=~])[A-Za-z\d@$!%*?#&^()[\]{}_\-+=~]{8,}$/,
            message: "Min 8 chars with upper, lower, number & special",
        },
    ];

    async function onFinish(values) {
        setSubmitting(true);
        await signup({
            name: values.name,
            email: values.email,
            password: values.password,
        });
        setSubmitting(false);
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#EFF6FF] via-[#DBEAFE] to-[#BFDBFE]">
            <main className="w-full max-w-lg mx-auto">
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-[rgba(59,130,246,0.12)] p-8 sm:p-10">
                    
                    {/* Logo */}
                    <div className="flex items-center justify-center mb-4">
                        {/* <Image
                            src="/logo.png"
                            alt="Indica Treasures"
                            width={200}
                            height={72}
                            className="object-contain"
                            priority
                        /> */}
                    </div>

                    {/* Header */}
                    <div className="text-center mb-6">
                        <Title level={3} className="!mb-1 !text-[1.375rem] text-[#1E3A8A]">
                            Create your account
                        </Title>
                        <Text className="text-[#4b5563]">
                            Join Indica Treasures & manage your store
                        </Text>
                    </div>

                    <Form
                        form={form}
                        layout="vertical"
                        requiredMark="optional"
                        onFinish={onFinish}
                        disabled={submitting || loading}
                    >
                        {/* Name */}
                        <Form.Item
                            label={<span className="text-sm font-medium text-[#1E40AF]">Full Name</span>}
                            name="name"
                            rules={[
                                { required: true, message: "Please enter your full name" },
                                { min: 2, message: "Name must be at least 2 characters" },
                            ]}
                            className="mb-4"
                        >
                            <Input
                                size="large"
                                placeholder="Prabhat Kumar"
                                prefix={<UserOutlined className="text-[#9CA3AF]" />}
                                className="rounded-lg shadow-sm border border-[var(--border,#E5E7EB)] focus:!ring-4 focus:!ring-[rgba(37,99,235,0.15)] focus:!border-[#2563EB] transition"
                                aria-label="Full name"
                            />
                        </Form.Item>

                        {/* Email */}
                        <Form.Item
                            label={<span className="text-sm font-medium text-[#1E40AF]">Email</span>}
                            name="email"
                            rules={[
                                { required: true, message: "Please enter your email" },
                                { type: "email", message: "Enter a valid email" },
                            ]}
                            className="mb-4"
                        >
                            <Input
                                size="large"
                                placeholder="you@example.com"
                                prefix={<MailOutlined className="text-[#9CA3AF]" />}
                                className="rounded-lg shadow-sm border border-[var(--border,#E5E7EB)] focus:!ring-4 focus:!ring-[rgba(37,99,235,0.15)] focus:!border-[#2563EB] transition"
                                aria-label="Email"
                            />
                        </Form.Item>

                        {/* Password */}
                        <Form.Item
                            label={<span className="text-sm font-medium text-[#1E40AF]">Password</span>}
                            name="password"
                            rules={passwordRules}
                            hasFeedback
                            className="mb-4"
                        >
                            <Input.Password
                                size="large"
                                placeholder="••••••••"
                                prefix={<LockOutlined className="text-[#9CA3AF]" />}
                                className="rounded-lg shadow-sm border border-[var(--border,#E5E7EB)] focus:!ring-4 focus:!ring-[rgba(37,99,235,0.15)] focus:!border-[#2563EB] transition"
                                aria-label="Password"
                            />
                        </Form.Item>

                        {/* Confirm Password */}
                        <Form.Item
                            label={<span className="text-sm font-medium text-[#1E40AF]">Confirm Password</span>}
                            name="confirmPassword"
                            dependencies={["password"]}
                            hasFeedback
                            rules={[
                                { required: true, message: "Please confirm your password" },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue("password") === value) return Promise.resolve();
                                        return Promise.reject(new Error("Passwords do not match"));
                                    },
                                }),
                            ]}
                            className="mb-4"
                        >
                            <Input.Password
                                size="large"
                                placeholder="Repeat password"
                                prefix={<LockOutlined className="text-[#9CA3AF]" />}
                                className="rounded-lg shadow-sm border border-[var(--border,#E5E7EB)] focus:!ring-4 focus:!ring-[rgba(37,99,235,0.15)] focus:!border-[#2563EB] transition"
                                aria-label="Confirm password"
                            />
                        </Form.Item>

                        {/* Terms */}
                        <Form.Item
                            name="agree"
                            valuePropName="checked"
                            rules={[
                                {
                                    validator: (_, v) =>
                                        v ? Promise.resolve() : Promise.reject(new Error("Please accept the terms")),
                                },
                            ]}
                            className="mb-4"
                        >
                            <Checkbox>
                                I agree to the{" "}
                                <a href="/terms" className="text-[#2563EB] hover:underline">
                                    Terms & Conditions
                                </a>
                            </Checkbox>
                        </Form.Item>

                        {/* CTA */}
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            block
                            loading={submitting || loading}
                            className="!h-12 !rounded-xl !bg-gradient-to-r !from-[#2563EB] !to-[#1D4ED8] hover:!from-[#1E40AF] hover:!to-[#1E3A8A] !border-none !text-white !font-semibold transition-all"
                        >
                            {submitting || loading ? "Creating account…" : "Sign up"}
                        </Button>

                        <Divider className="!my-4 !border-dashed" />

                        <p className="text-center text-sm text-[#4b5563] mt-5">
                            Already have an account?{" "}
                            <a href="/" className="text-[#2563EB] font-medium hover:underline">
                                Log in
                            </a>
                        </p>
                    </Form>
                </div>

                <div className="mt-4 text-center text-xs text-[#6B7280]">
                    By creating an account you agree to our{" "}
                    <a href="/terms" className="underline text-[#2563EB]">Terms</a> and{" "}
                    <a href="/privacy" className="underline text-[#2563EB]">Privacy Policy</a>.
                </div>
            </main>
        </div>
    );
}
