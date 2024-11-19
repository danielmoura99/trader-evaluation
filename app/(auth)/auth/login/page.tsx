"use client";

import { Suspense } from "react";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        name,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Credenciais inválidas");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setError("Ocorreu um erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md bg-card">
          <CardHeader>
            <CardTitle className="text-2xl text-center"></CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex justify-center mb-8">
              <Image
                src="/logo.png"
                width={180}
                height={39}
                alt="LOGO"
                style={{ width: "auto", height: "auto" }}
              />
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2 justify-center">
                <label htmlFor="name" className="text-sm font-medium">
                  Usuário
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Senha
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full"
                  disabled={isLoading}
                />
              </div>
              {error && (
                <div className="text-sm text-red-500 text-center">{error}</div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Suspense>
  );
}
