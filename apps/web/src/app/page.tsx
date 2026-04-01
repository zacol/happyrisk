'use client';

import { LogOut, Users } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HappyRisk</h1>
          <p className="text-muted-foreground">{user ? `Welcome, ${user.email}` : 'Dashboard'}</p>
        </div>
        {user && (
          <Button
            variant="outline"
            onClick={() => {
              void logout();
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/users" className="block">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>Create, edit, and manage user accounts and roles.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage all users in the system, assign roles, and control access.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
