import { cookies } from 'next/headers'
import { personByName, USER_COOKIE, type Person } from './people'

// The signed-in family member, read from the cookie set on the home page.
// Server-only (uses next/headers) — client components receive the current user
// as a prop from their server parent.
export async function getCurrentUser(): Promise<Person | null> {
  const value = (await cookies()).get(USER_COOKIE)?.value
  return personByName(value)
}
