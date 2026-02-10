import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  console.log(`🛣️ [Middleware] Path: ${pathname}, User: ${user ? 'Logged In' : 'Logged Out'}`)

  const isApiRoute = pathname.startsWith('/api')
  const isPublicRoute =
    pathname === '/login' ||
    pathname.startsWith('/auth/callback')

  // 1. Si NO está logueado y trata de entrar a algo privado (todo excepto login/callback/api)
  if (!user && !isPublicRoute && !isApiRoute) {
    console.log(`🚫 [Middleware] Redirecting to /login from ${pathname}`)
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Si YA está logueado y está en login o la raíz, mándalo al dashboard
  if (user && (pathname === '/login' || pathname === '/')) {
    console.log(`✅ [Middleware] Redirecting to /dashboard from ${pathname}`)
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}