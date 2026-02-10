'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Loader2, Zap, Dumbbell } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent, type: 'login' | 'signup') => {
    e.preventDefault()
    setIsLoading(true)

    // En Magic Link, signIn sirve para ambos, pero podemos personalizar el mensaje
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        // Opcional: Si quisieras separar lógicas podrías pasar metadatos aquí
        data: {
            auth_type: type
        }
      },
    })

    if (error) {
      toast.error('Error en el ritual', {
        description: error.message,
      })
    } else {
      toast.success(type === 'login' ? 'Enlace enviado' : 'Bienvenido a Grit', {
        description: 'Revisa tu correo. El enlace de acceso te espera.',
      })
    }
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <Tabs defaultValue="login" className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 space-y-2">
           <div className="p-3 rounded-full bg-zinc-100 border border-zinc-200">
             <Dumbbell className="h-8 w-8 text-black" />
           </div>
           <h1 className="text-3xl font-bold tracking-tighter italic text-black">GRIT</h1>
        </div>

        <TabsList className="grid w-full grid-cols-2 bg-zinc-100 text-zinc-500">
          <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-black">Entrar</TabsTrigger>
          <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:text-black">Registrarse</TabsTrigger>
        </TabsList>

        {/* --- PESTAÑA LOGIN --- */}
        <TabsContent value="login">
          <Card className="border-zinc-200 bg-white text-black shadow-lg">
            <CardHeader>
              <CardTitle>Bienvenido de nuevo</CardTitle>
              <CardDescription className="text-zinc-500">
                Tu progreso te espera. No rompas la racha.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={(e) => handleAuth(e, 'login')}>
                <div className="space-y-2">
                  <Label htmlFor="email-login">Email</Label>
                  <Input
                    id="email-login"
                    type="email"
                    placeholder="tu@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-zinc-50 border-zinc-200 focus:ring-black"
                  />
                </div>
                <Button className="w-full mt-4 bg-black text-white hover:bg-zinc-800 font-bold" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Iniciar Sesión"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- PESTAÑA SIGN UP --- */}
        <TabsContent value="signup">
          <Card className="border-zinc-200 bg-white text-black shadow-lg">
            <CardHeader>
              <CardTitle>Únete al sacrificio</CardTitle>
              <CardDescription className="text-zinc-500">
                Empieza hoy. Mañana te arrepentirás de no haber empezado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={(e) => handleAuth(e, 'signup')}>
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input
                    id="email-signup"
                    type="email"
                    placeholder="tu@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-zinc-50 border-zinc-200 focus:ring-black"
                  />
                </div>
                <Button className="w-full mt-4 bg-black text-white hover:bg-zinc-800 font-bold" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Zap className="w-4 h-4 mr-2" /> Crear Cuenta Gratis</>}
                </Button>
              </form>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-center w-full text-zinc-400">
                Al registrarte aceptas sufrir voluntariamente en el gimnasio.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}