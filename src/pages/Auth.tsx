import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, Mail, Sparkles } from 'lucide-react';
import { z } from 'zod';
import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast({
        title: 'Erro ao entrar',
        description: error.message === 'Invalid login credentials' 
          ? 'Email ou senha incorretos' 
          : error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Bem-vindo!',
        description: 'Login realizado com sucesso',
      });
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative bg-background">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 cyber-grid opacity-30" />
        <motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full gradient-glow"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full gradient-glow"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-primary/30"
          style={{
            left: `${20 + i * 15}%`,
            top: `${30 + (i % 3) * 20}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        />
      ))}

      {/* Login Card */}
      <motion.div 
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="glass-strong rounded-2xl shadow-float p-8 relative overflow-hidden">
          {/* Card glow effect */}
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-primary/5 blur-3xl" />
          
          <div className="relative z-10 space-y-8">
            {/* Logo and title */}
            <div className="text-center space-y-4">
              <motion.div 
                className="mx-auto w-20 h-20 rounded-2xl overflow-hidden shadow-glow border-2 border-primary/20"
                whileHover={{ scale: 1.05, rotate: 3 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <img src={logo} alt="GetMore Logo" className="h-full w-full object-cover" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-display text-foreground tracking-wider">GETMORE</h1>
                <p className="text-muted-foreground mt-2 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Sistema de Gestão Integrada
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 bg-secondary/50 border-border/50 rounded-xl transition-all duration-300 focus:bg-secondary focus:border-primary/50 focus:shadow-glow-sm"
                    disabled={loading}
                  />
                </div>
                {errors.email && (
                  <motion.p 
                    className="text-sm text-destructive"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {errors.email}
                  </motion.p>
                )}
              </motion.div>

              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Senha
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-14 bg-secondary/50 border-border/50 rounded-xl transition-all duration-300 focus:bg-secondary focus:border-primary/50 focus:shadow-glow-sm"
                    disabled={loading}
                  />
                </div>
                {errors.password && (
                  <motion.p 
                    className="text-sm text-destructive"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {errors.password}
                  </motion.p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  type="submit"
                  className="w-full h-14 text-base font-semibold rounded-xl gradient-primary shadow-glow transition-all duration-300 hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </motion.div>
            </form>
          </div>
        </div>

        {/* Bottom decoration */}
        <motion.div 
          className="mt-6 flex justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary/40"
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.4, 0.8, 0.4]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}