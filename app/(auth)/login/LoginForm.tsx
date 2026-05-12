"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  signInWithPassword,
  signInWithMagicLink,
  type AuthFormState,
} from "./actions";

const initialState: AuthFormState = {};

export function LoginForm() {
  const [pwState, pwAction, pwPending] = useActionState(
    signInWithPassword,
    initialState,
  );
  const [otpState, otpAction, otpPending] = useActionState(
    signInWithMagicLink,
    initialState,
  );

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-widest text-amber-700 dark:text-amber-400">
          Stone Ridge Ward
        </p>
        <CardTitle className="text-2xl">Young Men</CardTitle>
        <CardDescription>
          Sign in to see this week&apos;s schedule, assignments, and lesson.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form action={pwAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {pwState.error ? (
            <p className="text-sm text-destructive">{pwState.error}</p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pwPending}>
            {pwPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-card px-2 text-xs text-muted-foreground">
            or
          </span>
        </div>

        <form action={otpAction} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="magic-email">Email me a magic link</Label>
            <Input
              id="magic-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
          </div>
          {otpState.error ? (
            <p className="text-sm text-destructive">{otpState.error}</p>
          ) : null}
          {otpState.message ? (
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              {otpState.message}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="outline"
            className="w-full"
            disabled={otpPending}
          >
            {otpPending ? "Sending..." : "Send magic link"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Need an account?{" "}
          <Link href="/signup" className="font-medium text-foreground underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
