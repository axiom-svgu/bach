"use client";

import { signInWithSpotify } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { GalleryVerticalEnd, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          bach
        </a>

        <div className={cn("flex flex-col gap-6")}>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Welcome homie</CardTitle>
              <CardDescription>Sign in with Spotify</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <Button onClick={signInWithSpotify} className="w-full">
                  Continue with Spotify
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
            we don't have a privacy policy or terms of service yet. it's an app
            for organizing your spotify library god damn.
          </div>
        </div>
      </div>
    </div>
  );
}
