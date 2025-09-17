"use client";

import { useAuth } from "@/app/components/hooks/useAuth";
import { Form, Input, Button, Typography, Checkbox, Divider } from "antd";
import Link from "next/link";

const { Title, Text } = Typography;

export default function LoginPage() {
  const [form] = Form.useForm();
  const { login, loading } = useAuth();

  async function onFinish(values) {
    await login(values);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-tr from-[#EFF6FF] via-[#DBEAFE] to-[#BFDBFE]">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-[rgba(59,130,246,0.12)] p-6">
        
        {/* Logo */}
        <div className="flex items-center justify-center mb-3">
          {/* <Image src="/logo.png" alt="Indica Treasures" width={180} height={80} className="object-contain" /> */}
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <Title level={3} className="!mb-1 !text-[1.375rem] text-[#1E3A8A]">
            Welcome back
          </Title>
          <Text className="text-[#4b5563]">
            Sign in to access your Indica Treasures dashboard
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          requiredMark="optional"
          onFinish={onFinish}
          disabled={loading}
          initialValues={{ remember: true }}
        >
          {/* Email */}
          <Form.Item
            label={<span className="text-sm font-medium text-[#1E40AF]">Email</span>}
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Enter a valid email" },
            ]}
            className="mb-3"
          >
            <Input
              placeholder="you@example.com"
              size="large"
              className="rounded-lg shadow-sm border border-[var(--border,#E5E7EB)] focus:!ring-4 focus:!ring-[rgba(37,99,235,0.15)] focus:!border-[#2563EB] transition"
            />
          </Form.Item>

          {/* Password */}
          <Form.Item
            label={<span className="text-sm font-medium text-[#1E40AF]">Password</span>}
            name="password"
            rules={[{ required: true, message: "Please enter your password" }]}
            className="mb-2"
          >
            <Input.Password
              placeholder="••••••••"
              size="large"
              className="rounded-lg shadow-sm border border-[var(--border,#E5E7EB)] focus:!ring-4 focus:!ring-[rgba(37,99,235,0.15)] focus:!border-[#2563EB] transition"
            />
          </Form.Item>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between mb-4">
            <Form.Item name="remember" valuePropName="checked" className="!mb-0">
              <Checkbox className="text-sm text-[#1E3A8A]">Remember me</Checkbox>
            </Form.Item>
            <Link
              href="/forgot-password"
              className="text-sm text-[#2563EB] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Primary CTA - Blue gradient */}
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
            className="!h-11 !rounded-xl !bg-gradient-to-r !from-[#2563EB] !to-[#1D4ED8] hover:!from-[#1E40AF] hover:!to-[#1E3A8A] !border-none !text-white !font-semibold transition-all"
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>

          <Divider className="!my-4 !border-dashed" />

          <p className="text-center text-sm text-[#4b5563]">
            Don’t have an account?{" "}
            <Link href="/signup" className="text-[#2563EB] font-medium hover:underline">
              Create one
            </Link>
          </p>
        </Form>

        <div className="mt-4 text-center text-xs text-[#6B7280]">
          By creating an account you agree to our{" "}
          <a href="/terms" className="underline text-[#2563EB]">Terms</a> and{" "}
          <a href="/privacy" className="underline text-[#2563EB]">Privacy Policy</a>.
        </div>
      </div>
    </div>
  );
}
