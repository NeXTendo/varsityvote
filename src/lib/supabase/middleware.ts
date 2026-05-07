import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

type UserRole = Database['public']['Enums']['user_role']

const ROLE_HOME: Record<UserRole, string> = {
  super_admin:    '/super-admin/dashboard',
  election_admin: '/admin/dashboard',
  candidate:      '/candidate/dashboard',
  voter:          '/voter/elections',
}

const PROTECTED_PREFIXES: Record<string, UserRole[]> = {
  '/super-admin': ['super_admin'],
  '/admin':       ['super_admin', 'election_admin'],
  '/candidate':   ['super_admin', 'election_admin', 'candidate'],
  '/voter':       ['super_admin', 'election_admin', 'candidate', 'voter'],
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string, value: string, options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — do not remove
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Redirect authenticated users away from auth pages
  if (user && (pathname === '/login' || pathname === '/register' || pathname === '/')) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role, require_password_change')
      .eq('id', user.id)
      .single() as any as { data: { role: UserRole, require_password_change: boolean } | null }
 
    if (profileData?.require_password_change) {
      return NextResponse.redirect(new URL('/change-password', request.url))
    }

    const role = profileData?.role ?? 'voter'
    return NextResponse.redirect(new URL(ROLE_HOME[role], request.url))
  }

  // Protect role-gated routes
  for (const [prefix, allowedRoles] of Object.entries(PROTECTED_PREFIXES)) {
    if (pathname.startsWith(prefix)) {
      if (!user) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('role, require_password_change')
        .eq('id', user.id)
        .single() as any as { data: { role: UserRole, require_password_change: boolean } | null }
 
      if (profileData?.require_password_change && pathname !== '/change-password') {
        return NextResponse.redirect(new URL('/change-password', request.url))
      }

      const role = profileData?.role ?? 'voter'

      if (!allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL(ROLE_HOME[role], request.url))
      }
      break
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}