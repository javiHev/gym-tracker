'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Loader2, Zap, Dumbbell } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
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
      toast({
        variant: "destructive",
        title: "Error en el ritual",
        description: error.message,
      })
    } else {
      toast({
        title: type === 'login' ? "Enlace enviado" : "Bienvenido a Grit",
        description: "Revisa tu correo. El enlace de acceso te espera.",
      })
    }
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black">
      <Tabs defaultValue="login" className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 space-y-2">
           <div className="p-3 rounded-full bg-zinc-900 border border-zinc-800">
             <Dumbbell className="h-8 w-8 text-white" />
           </div>
           <h1 className="text-3xl font-bold tracking-tighter italic text-white">GRIT</h1>
        </div>

        <TabsList className="grid w-full grid-cols-2 bg-zinc-900 text-zinc-400">
          <TabsTrigger value="login" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Entrar</TabsTrigger>
          <TabsTrigger value="signup" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Registrarse</TabsTrigger>
        </TabsList>

        {/* --- PESTAÑA LOGIN --- */}
        <TabsContent value="login">
          <Card className="border-zinc-800 bg-zinc-950 text-white shadow-2xl">
            <CardHeader>
              <CardTitle>Bienvenido de nuevo</CardTitle>
              <CardDescription className="text-zinc-400">
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
                    className="bg-zinc-900 border-zinc-800 focus:ring-blue-600"
                  />
                </div>
                <Button className="w-full mt-4 bg-white text-black hover:bg-zinc-200 font-bold" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Iniciar Sesión"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- PESTAÑA SIGN UP --- */}
        <TabsContent value="signup">
          <Card className="border-zinc-800 bg-zinc-950 text-white shadow-2xl">
            <CardHeader>
              <CardTitle>Únete al sacrificio</CardTitle>
              <CardDescription className="text-zinc-400">
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
                    className="bg-zinc-900 border-zinc-800 focus:ring-blue-600"
                  />
                </div>
                <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Zap className="w-4 h-4 mr-2" /> Crear Cuenta Gratis</>}
                </Button>
              </form>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-center w-full text-zinc-500">
                Al registrarte aceptas sufrir voluntariamente en el gimnasio.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}