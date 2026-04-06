import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Monitor, Palette, Shield, Bell, Key, Database, Globe, Moon, Sun, Save } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SettingsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    encryptionLevel: "AES-256",
    autoSave: true,
    notifications: true,
    darkMode: true,
    language: "en",
  });

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setSettings({
          encryptionLevel: data.encryption_level || "AES-256",
          autoSave: data.auto_save ?? true,
          notifications: data.notifications ?? true,
          darkMode: data.dark_mode ?? true,
          language: data.language || "en",
        });
      }
    } catch (error: any) {
      console.error("Error loading settings:", error);
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          encryption_level: settings.encryptionLevel,
          auto_save: settings.autoSave,
          notifications: settings.notifications,
          dark_mode: settings.darkMode,
          language: settings.language,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      toast.success("Settings saved successfully");
    } catch (error: any) {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const settingsSections = [
    { 
      icon: Shield, 
      label: "Encryption", 
      desc: "Default cipher suite and key length",
      content: (
        <div className="mt-3">
          <Label className="text-xs text-muted-foreground">Encryption Level</Label>
          <select
            value={settings.encryptionLevel}
            onChange={(e) => setSettings({ ...settings, encryptionLevel: e.target.value })}
            className="w-full mt-1 bg-muted/40 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-glow-cyan/50"
          >
            <option value="AES-128">AES-128</option>
            <option value="AES-256">AES-256</option>
            <option value="AES-256+RSA">AES-256 + RSA</option>
          </select>
        </div>
      )
    },
    { 
      icon: Bell, 
      label: "Notifications", 
      desc: "Alert preferences and reminders",
      content: (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Enable Notifications</span>
          <Switch
            checked={settings.notifications}
            onCheckedChange={(checked) => setSettings({ ...settings, notifications: checked })}
          />
        </div>
      )
    },
    { 
      icon: Database, 
      label: "Data", 
      desc: "Auto-save and backup options",
      content: (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Auto-save to Vault</span>
          <Switch
            checked={settings.autoSave}
            onCheckedChange={(checked) => setSettings({ ...settings, autoSave: checked })}
          />
        </div>
      )
    },
    { 
      icon: Globe, 
      label: "Language", 
      desc: "Interface language preference",
      content: (
        <div className="mt-3">
          <select
            value={settings.language}
            onChange={(e) => setSettings({ ...settings, language: e.target.value })}
            className="w-full bg-muted/40 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-glow-cyan/50"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
        </div>
      )
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-auto grid-bg">
      <header className="px-6 py-4 border-b border-border/30 glass-strong">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Settings</h2>
          <p className="text-xs text-muted-foreground font-mono">
            Configure encryption parameters and preferences
          </p>
        </div>
      </header>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-4">
        {settingsSections.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-lg p-5 hover:border-glow-violet transition-all duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
                {item.content}
              </div>
            </div>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pt-4"
        >
          <Button
            onClick={saveSettings}
            disabled={loading}
            className="w-full bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan border-glow-cyan"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
