import React, { useState } from 'react';
import Head from 'next/head';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
} from '@heroicons/react/24/solid';

/**
 * Design System Showcase Page
 *
 * This page demonstrates all design system components with their variants.
 * Used as a living documentation and reference for developers.
 *
 * Access: /design-system
 */
export default function DesignSystemPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <>
      <Head>
        <title>Design System - YouOke</title>
        <meta name="description" content="YouOke Design System Showcase" />
      </Head>

      <div className="min-h-screen bg-base-200 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              YouOke Design System
            </h1>
            <p className="text-lg text-gray-600">
              Living documentation of components, styles, and patterns
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Based on DaisyUI + Tailwind CSS + Custom Theme
            </p>
          </div>

          <div className="space-y-16">
            {/* ========== COLORS ========== */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Color Palette</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* Primary */}
                <Card variant="default">
                  <Card.Body padding="sm">
                    <div className="w-full h-20 bg-primary rounded mb-2"></div>
                    <h3 className="font-semibold text-sm">Primary</h3>
                    <p className="text-xs text-gray-500">#ef4444</p>
                  </Card.Body>
                </Card>

                {/* Secondary */}
                <Card variant="default">
                  <Card.Body padding="sm">
                    <div className="w-full h-20 bg-secondary rounded mb-2"></div>
                    <h3 className="font-semibold text-sm">Secondary</h3>
                    <p className="text-xs text-gray-500">#6b7280</p>
                  </Card.Body>
                </Card>

                {/* Success */}
                <Card variant="default">
                  <Card.Body padding="sm">
                    <div className="w-full h-20 bg-success rounded mb-2"></div>
                    <h3 className="font-semibold text-sm">Success</h3>
                    <p className="text-xs text-gray-500">#10b981</p>
                  </Card.Body>
                </Card>

                {/* Error */}
                <Card variant="default">
                  <Card.Body padding="sm">
                    <div className="w-full h-20 bg-error rounded mb-2"></div>
                    <h3 className="font-semibold text-sm">Error</h3>
                    <p className="text-xs text-gray-500">#ef4444</p>
                  </Card.Body>
                </Card>

                {/* Warning */}
                <Card variant="default">
                  <Card.Body padding="sm">
                    <div className="w-full h-20 bg-warning rounded mb-2"></div>
                    <h3 className="font-semibold text-sm">Warning</h3>
                    <p className="text-xs text-gray-500">#f59e0b</p>
                  </Card.Body>
                </Card>

                {/* Info */}
                <Card variant="default">
                  <Card.Body padding="sm">
                    <div className="w-full h-20 bg-info rounded mb-2"></div>
                    <h3 className="font-semibold text-sm">Info</h3>
                    <p className="text-xs text-gray-500">#3b82f6</p>
                  </Card.Body>
                </Card>
              </div>
            </section>

            {/* ========== TYPOGRAPHY ========== */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Typography</h2>

              <Card variant="default">
                <Card.Body>
                  <div className="space-y-4">
                    <div>
                      <h1 className="text-3xl font-bold">Heading 1 - 30px Bold</h1>
                      <code className="text-xs text-gray-500">text-3xl font-bold</code>
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold">Heading 2 - 24px Semibold</h2>
                      <code className="text-xs text-gray-500">text-2xl font-semibold</code>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Heading 3 - 20px Semibold</h3>
                      <code className="text-xs text-gray-500">text-xl font-semibold</code>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold">Heading 4 - 18px Semibold</h4>
                      <code className="text-xs text-gray-500">text-lg font-semibold</code>
                    </div>
                    <div>
                      <p className="text-base">Body Text - 16px Normal</p>
                      <code className="text-xs text-gray-500">text-base</code>
                    </div>
                    <div>
                      <p className="text-sm">Small Text - 14px Normal</p>
                      <code className="text-xs text-gray-500">text-sm</code>
                    </div>
                    <div>
                      <p className="text-xs">Tiny Text - 12px Normal</p>
                      <code className="text-xs text-gray-500">text-xs</code>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </section>

            {/* ========== BUTTONS ========== */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Buttons</h2>

              {/* Button Variants */}
              <Card variant="default" className="mb-6">
                <Card.Body>
                  <h3 className="text-xl font-semibold mb-4">Variants</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="success">Success</Button>
                    <Button variant="error">Error</Button>
                    <Button variant="warning">Warning</Button>
                    <Button variant="info">Info</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                  </div>
                </Card.Body>
              </Card>

              {/* Button Sizes */}
              <Card variant="default" className="mb-6">
                <Card.Body>
                  <h3 className="text-xl font-semibold mb-4">Sizes</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="primary" size="sm">Small</Button>
                    <Button variant="primary" size="md">Medium (Default)</Button>
                    <Button variant="primary" size="lg">Large</Button>
                  </div>
                </Card.Body>
              </Card>

              {/* Button States */}
              <Card variant="default" className="mb-6">
                <Card.Body>
                  <h3 className="text-xl font-semibold mb-4">States</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary" loading={loading} onClick={handleLoadingDemo}>
                      {loading ? 'Loading...' : 'Click to Load'}
                    </Button>
                    <Button variant="primary" disabled>Disabled</Button>
                    <Button variant="primary" block>Full Width Button</Button>
                  </div>
                </Card.Body>
              </Card>

              {/* Button with Hover Effect */}
              <Card variant="default">
                <Card.Body>
                  <h3 className="text-xl font-semibold mb-4">With Hover Animation</h3>
                  <div className="flex flex-wrap gap-3">
                    <button className="btn btn-primary btn-hover">Hover Me</button>
                    <button className="btn btn-secondary btn-hover">Hover Me Too</button>
                  </div>
                  <code className="text-xs text-gray-500 mt-2 block">className="btn btn-primary btn-hover"</code>
                </Card.Body>
              </Card>
            </section>

            {/* ========== CARDS ========== */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Cards</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Default Card */}
                <Card variant="default">
                  <Card.Body>
                    <Card.Title size="lg">Default Card</Card.Title>
                    <p className="text-gray-600">
                      Standard card with shadow and border. Most common variant for content containers.
                    </p>
                    <code className="text-xs text-gray-500 mt-2 block">variant="default"</code>
                  </Card.Body>
                </Card>

                {/* Elevated Card */}
                <Card variant="elevated">
                  <Card.Body>
                    <Card.Title size="lg">Elevated Card</Card.Title>
                    <p className="text-gray-600">
                      Card with deeper shadow, no border. Use for emphasis or floating elements.
                    </p>
                    <code className="text-xs text-gray-500 mt-2 block">variant="elevated"</code>
                  </Card.Body>
                </Card>

                {/* Bordered Card */}
                <Card variant="bordered">
                  <Card.Body>
                    <Card.Title size="lg">Bordered Card</Card.Title>
                    <p className="text-gray-600">
                      Card with border only, minimal shadow. Clean and minimal look.
                    </p>
                    <code className="text-xs text-gray-500 mt-2 block">variant="bordered"</code>
                  </Card.Body>
                </Card>

                {/* Gradient Card */}
                <Card variant="gradient">
                  <Card.Body>
                    <Card.Title size="lg">Gradient Card</Card.Title>
                    <p className="text-gray-700">
                      Card with gradient background. Perfect for highlights or CTAs.
                    </p>
                    <code className="text-xs text-gray-500 mt-2 block">variant="gradient"</code>
                  </Card.Body>
                </Card>

                {/* Card with Hover */}
                <div className="card bg-white shadow-sm hover:shadow-xl transition-shadow cursor-pointer">
                  <div className="card-body">
                    <h3 className="card-title text-xl">Interactive Card</h3>
                    <p className="text-gray-600">
                      Hover me! Card with smooth shadow transition on hover.
                    </p>
                    <code className="text-xs text-gray-500 mt-2 block">className="card-hover"</code>
                  </div>
                </div>
              </div>
            </section>

            {/* ========== INPUTS ========== */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Form Inputs</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card variant="default">
                  <Card.Body>
                    <h3 className="text-xl font-semibold mb-4">Input Variants</h3>

                    {/* Basic Input */}
                    <Input
                      type="text"
                      label="ชื่อ"
                      placeholder="กรอกชื่อของคุณ"
                      helperText="ข้อความช่วยเหลือ"
                      containerClassName="mb-4"
                    />

                    {/* Input with Icon */}
                    <Input
                      type="email"
                      label="อีเมล"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      leftIcon={<EnvelopeIcon className="w-5 h-5" />}
                      containerClassName="mb-4"
                    />

                    {/* Input with Error */}
                    <Input
                      type="password"
                      label="รหัสผ่าน"
                      placeholder="กรอกรหัสผ่าน"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      leftIcon={<LockClosedIcon className="w-5 h-5" />}
                      error={password.length > 0 && password.length < 6 ? "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" : false}
                      containerClassName="mb-4"
                    />

                    {/* Disabled Input */}
                    <Input
                      type="text"
                      label="ปิดการใช้งาน"
                      placeholder="ช่องนี้ไม่สามารถแก้ไขได้"
                      disabled
                      value="Disabled input"
                    />
                  </Card.Body>
                </Card>

                <Card variant="default">
                  <Card.Body>
                    <h3 className="text-xl font-semibold mb-4">Input Sizes</h3>

                    <Input
                      size="sm"
                      label="Small Input"
                      placeholder="Small size"
                      containerClassName="mb-4"
                    />

                    <Input
                      size="md"
                      label="Medium Input (Default)"
                      placeholder="Medium size"
                      containerClassName="mb-4"
                    />

                    <Input
                      size="lg"
                      label="Large Input"
                      placeholder="Large size"
                    />
                  </Card.Body>
                </Card>
              </div>
            </section>

            {/* ========== BADGES ========== */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Badges</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Badge Variants */}
                <Card variant="default">
                  <Card.Body>
                    <h3 className="text-xl font-semibold mb-4">Variants</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="primary">Primary</Badge>
                      <Badge variant="secondary">Secondary</Badge>
                      <Badge variant="success">Success</Badge>
                      <Badge variant="error">Error</Badge>
                      <Badge variant="warning">Warning</Badge>
                      <Badge variant="info">Info</Badge>
                    </div>
                  </Card.Body>
                </Card>

                {/* Badge Sizes */}
                <Card variant="default">
                  <Card.Body>
                    <h3 className="text-xl font-semibold mb-4">Sizes</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="primary" size="sm">Small</Badge>
                      <Badge variant="primary" size="md">Medium</Badge>
                      <Badge variant="primary" size="lg">Large</Badge>
                    </div>
                  </Card.Body>
                </Card>

                {/* Badge Outline */}
                <Card variant="default" className="md:col-span-2">
                  <Card.Body>
                    <h3 className="text-xl font-semibold mb-4">Outline Style</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="badge badge-outline badge-primary">Primary</span>
                      <span className="badge badge-outline badge-secondary">Secondary</span>
                      <span className="badge badge-outline badge-success">Success</span>
                      <span className="badge badge-outline badge-error">Error</span>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </section>

            {/* ========== ANIMATIONS ========== */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Animations</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Fade In */}
                <Card variant="default" className="animate-fade-in">
                  <Card.Body>
                    <h3 className="text-lg font-semibold mb-2">Fade In</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Smooth fade in animation
                    </p>
                    <code className="text-xs text-gray-500">animate-fade-in</code>
                  </Card.Body>
                </Card>

                {/* Scale In */}
                <Card variant="default" className="animate-scale-in">
                  <Card.Body>
                    <h3 className="text-lg font-semibold mb-2">Scale In</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Scale from 0.9 to 1.0
                    </p>
                    <code className="text-xs text-gray-500">animate-scale-in</code>
                  </Card.Body>
                </Card>

                {/* Gentle Pulse */}
                <Card variant="default" className="animate-gentle-pulse">
                  <Card.Body>
                    <h3 className="text-lg font-semibold mb-2">Gentle Pulse</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Pulsing opacity effect
                    </p>
                    <code className="text-xs text-gray-500">animate-gentle-pulse</code>
                  </Card.Body>
                </Card>
              </div>

              <Card variant="default" className="mt-6">
                <Card.Body>
                  <h3 className="text-xl font-semibold mb-4">Interactive Hover Effects</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card bg-white shadow-sm card-hover p-4 cursor-pointer">
                      <h4 className="font-semibold">Card Hover</h4>
                      <p className="text-sm text-gray-600">Hover to see shadow and lift effect</p>
                      <code className="text-xs text-gray-500">className="card-hover"</code>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-primary btn-hover">Button Hover</button>
                      <code className="text-xs text-gray-500 self-center">className="btn-hover"</code>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </section>

            {/* ========== NOTIFICATIONS ========== */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Toast Notifications</h2>

              <Card variant="default">
                <Card.Body>
                  <p className="text-gray-600 mb-4">
                    Toast notifications are managed by ToastContext. Use these methods:
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircleIcon className="w-6 h-6 text-success flex-shrink-0" />
                      <div className="flex-1">
                        <code className="text-sm">toast.success("Success message")</code>
                        <p className="text-xs text-gray-500">Green background, success icon</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <XCircleIcon className="w-6 h-6 text-error flex-shrink-0" />
                      <div className="flex-1">
                        <code className="text-sm">toast.error("Error message")</code>
                        <p className="text-xs text-gray-500">Red background, error icon</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <ExclamationTriangleIcon className="w-6 h-6 text-warning flex-shrink-0" />
                      <div className="flex-1">
                        <code className="text-sm">toast.warning("Warning message")</code>
                        <p className="text-xs text-gray-500">Yellow background, warning icon</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <InformationCircleIcon className="w-6 h-6 text-info flex-shrink-0" />
                      <div className="flex-1">
                        <code className="text-sm">toast.info("Info message")</code>
                        <p className="text-xs text-gray-500">Blue background, info icon</p>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </section>

            {/* ========== SPACING SYSTEM ========== */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Spacing System</h2>

              <Card variant="default">
                <Card.Body>
                  <p className="text-gray-600 mb-6">
                    All spacing follows Tailwind's 4px base unit system
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-1 h-8 bg-primary"></div>
                      <div>
                        <code className="text-sm font-semibold">gap-1 / p-1 / m-1</code>
                        <p className="text-xs text-gray-500">4px - Tight spacing</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-2 h-8 bg-primary"></div>
                      <div>
                        <code className="text-sm font-semibold">gap-2 / p-2 / m-2</code>
                        <p className="text-xs text-gray-500">8px - Small gaps</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-4 h-8 bg-primary"></div>
                      <div>
                        <code className="text-sm font-semibold">gap-4 / p-4 / m-4</code>
                        <p className="text-xs text-gray-500">16px - Default spacing</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-6 h-8 bg-primary"></div>
                      <div>
                        <code className="text-sm font-semibold">gap-6 / p-6 / m-6</code>
                        <p className="text-xs text-gray-500">24px - Section spacing</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-primary"></div>
                      <div>
                        <code className="text-sm font-semibold">gap-8 / p-8 / m-8</code>
                        <p className="text-xs text-gray-500">32px - Large spacing</p>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </section>

            {/* ========== FOOTER ========== */}
            <section className="text-center py-8">
              <Card variant="gradient">
                <Card.Body>
                  <h3 className="text-2xl font-bold mb-2">Design System Complete</h3>
                  <p className="text-gray-700 mb-4">
                    All components follow these consistent patterns.
                    Refer to DESIGN-SYSTEM.md for detailed documentation.
                  </p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    <Badge variant="success">Phase 0 Complete</Badge>
                    <Badge variant="info">Version 1.0.0</Badge>
                    <Badge variant="primary">2025-12-21</Badge>
                  </div>
                </Card.Body>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
