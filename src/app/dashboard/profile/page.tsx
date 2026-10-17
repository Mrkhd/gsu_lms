import { PageHeader } from "@/components/dashboard-shell"
import { ChangePasswordForm } from "@/components/change-password-form"
import { ProfileForm } from "@/components/profile-form"
import { eq } from "drizzle-orm"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDb } from "@/db/client"
import { profiles } from "@/db/schema"
import { requireUser } from "@/lib/auth/server"

export const metadata = { title: "Profile" }

export default async function ProfilePage() {
  const user = await requireUser()
  const db = getDb()
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1)

  return (
    <div>
      <PageHeader title="Profile" description="Manage your personal information." />
      <Card>
        <CardContent className="pt-6">
          <ProfileForm
            defaults={{
              firstName: profile?.firstName ?? "",
              lastName: profile?.lastName ?? "",
              headline: profile?.headline ?? "",
              bio: profile?.bio ?? "",
              avatarUrl: profile?.avatarUrl ?? "",
              email: user.email,
            }}
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change the password you use to sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  )
}
