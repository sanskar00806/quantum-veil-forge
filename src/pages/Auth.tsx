import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Lock, UserPlus, LogIn, AlertCircle, Eye, EyeOff, Mail, ArrowLeft, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: "Account created",
          description: "Check your email to confirm your account.",
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (error) throw error;
      setSuccessMessage("Password reset link sent! Check your email.");
      toast({
        title: "Reset link sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background grid-bg p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/20 border-glow-violet flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-wide">STEGACRYPT</h1>
            <p className="text-[10px] text-muted-foreground font-mono">QUANTUM SECURITY SUITE</p>
          </div>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-2xl p-8 border-glow-violet">
          {/* Forgot Password View */}
          {showForgotPassword ? (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <button
                onClick={() => { setShowForgotPassword(false); setError(""); setSuccessMessage(""); }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </button>

              <div className="mb-6">
                <div className="w-12 h-12 rounded-xl bg-neon-cyan/10 border-glow-cyan flex items-center justify-center mb-4">
                  <KeyRound className="w-6 h-6 text-neon-cyan" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-2">Reset Password</h2>
                <p className="text-sm text-muted-foreground">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-destructive">{error}</p>
                  </motion.div>
                )}
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-start gap-2"
                  >
                    <Shield className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-500">{successMessage}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <Label htmlFor="reset-email" className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                    Email Address
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="agent@stegacrypt.io"
                    required
                    className="mt-1.5 bg-secondary/50 border-border/50 focus:border-primary/50"
                  />
                </div>

                <Button
                  type="submit"
                  variant="execute"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Sending Reset Link...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Send Reset Link
                    </span>
                  )}
                </Button>
              </form>
            </motion.div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex gap-1 mb-6 p-1 rounded-lg bg-secondary/50">
                <button
                  onClick={() => { setIsLogin(true); setError(""); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                    isLogin ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
                <button
                  onClick={() => { setIsLogin(false); setError(""); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                    !isLogin ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </button>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-destructive">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {!isLogin && (
                    <motion.div
                      key="displayName"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Label htmlFor="displayName" className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                        Display Name
                      </Label>
                      <Input
                        id="displayName"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Agent_Zero"
                        className="mt-1.5 bg-secondary/50 border-border/50 focus:border-primary/50"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <Label htmlFor="email" className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="agent@stegacrypt.io"
                    required
                    className="mt-1.5 bg-secondary/50 border-border/50 focus:border-primary/50"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                    Password
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      minLength={6}
                      className="bg-secondary/50 border-border/50 focus:border-primary/50 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-neon-cyan hover:text-neon-cyan/80 mt-2 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="execute"
                  className="w-full mt-2"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      {isLogin ? "Authenticating..." : "Creating Account..."}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      {isLogin ? "Access Terminal" : "Initialize Account"}
                    </span>
                  )}
                </Button>
              </form>
            </>
          )}

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6 font-mono">
            ENCRYPTED • END-TO-END • ZERO KNOWLEDGE
          </p>
        </div>
      </motion.div>
    </div>
  );
}
