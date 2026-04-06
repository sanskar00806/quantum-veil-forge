import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Monitor, Palette, Shield, Bell, Key, Database, Globe, Moon, Sun, Save, Trash2, Download, Eye, Lock, UserCog, History, Smartphone, Cloud } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const SettingsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    encryptionLevel: "AES-256",
    autoSave: true,
    notifications: true,
    darkMode: true,
    language: "en",
    twoFactorAuth: false,
    sessionTimeout: 30,
    maxFileSize: 100,
    compressImages: true,
    backupFrequency: "daily",
    themeColor: "cyan",
    fontSize: "medium",
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
          encryptionLevel: "AES-256",
          autoSave: true,
          notifications: true,
          darkMode: data.theme === 'dark',
          language: "en",
          twoFactorAuth: data.two_factor_auth ?? false,
          sessionTimeout: data.session_timeout || 30,
          maxFileSize: data.max_file_size || 100,
          compressImages: data.compress_images ?? true,
          backupFrequency: data.backup_frequency || "daily",
          themeColor: data.theme_color || "cyan",
          fontSize: data.font_size || "medium",
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
      console.log('Saving settings with payload:', {
        user_id: user.id,
        encryption_level: settings.encryptionLevel,
        auto_save: settings.autoSave,
        notifications: settings.notifications,
        dark_mode: settings.darkMode,
        language: settings.language,
        two_factor_auth: settings.twoFactorAuth,
        session_timeout: settings.sessionTimeout,
        max_file_size: settings.maxFileSize,
        compress_images: settings.compressImages,
        backup_frequency: settings.backupFrequency,
        theme_color: settings.themeColor,
        font_size: settings.fontSize,
      });

      const { data, error } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          encryption_level: settings.encryptionLevel,
          auto_save: settings.autoSave,
          notifications: settings.notifications,
          dark_mode: settings.darkMode,
          language: settings.language,
          two_factor_auth: settings.twoFactorAuth,
          session_timeout: settings.sessionTimeout,
          max_file_size: settings.maxFileSize,
          compress_images: settings.compressImages,
          backup_frequency: settings.backupFrequency,
          theme_color: settings.themeColor,
          font_size: settings.fontSize,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Settings saved successfully:', data);
      toast.success("Settings saved successfully");
    } catch (error: any) {
      console.error('Full error details:', error);
      toast.error(`Failed to save settings: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const settingsSections = [
    { 
      icon: Shield, 
      label: "Security & Encryption", 
      desc: "Cipher suite, authentication, and security policies",
      content: (
        <div className="mt-3 space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Encryption Level</Label>
            <select
              value={settings.encryptionLevel}
              onChange={(e) => setSettings({ ...settings, encryptionLevel: e.target.value })}
              className="w-full mt-1 bg-muted/40 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-glow-cyan/50"
            >
              <option value="AES-128">AES-128 (Fast)</option>
              <option value="AES-256">AES-256 (Recommended)</option>
              <option value="AES-256+RSA">AES-256 + RSA (Maximum Security)</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-foreground">Two-Factor Authentication</span>
              <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
            </div>
            <Switch
              checked={settings.twoFactorAuth}
              onCheckedChange={(checked) => setSettings({ ...settings, twoFactorAuth: checked })}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-muted-foreground">Session Timeout (minutes)</Label>
              <span className="text-xs text-neon-cyan">{settings.sessionTimeout} min</span>
            </div>
            <Slider
              value={[settings.sessionTimeout]}
              onValueChange={(val) => setSettings({ ...settings, sessionTimeout: val[0] })}
              min={5}
              max={120}
              step={5}
              className="py-2"
            />
          </div>
        </div>
      )
    },
    { 
      icon: Bell, 
      label: "Notifications & Alerts", 
      desc: "Stay informed with customizable alerts",
      content: (
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-foreground">Push Notifications</span>
              <p className="text-xs text-muted-foreground">Receive real-time alerts</p>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(checked) => setSettings({ ...settings, notifications: checked })}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Backup Frequency</Label>
            <select
              value={settings.backupFrequency}
              onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
              className="w-full mt-1 bg-muted/40 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-glow-cyan/50"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="manual">Manual Only</option>
            </select>
          </div>
        </div>
      )
    },
    { 
      icon: Database, 
      label: "Data & Storage", 
      desc: "Manage storage limits and file handling",
      content: (
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-foreground">Auto-save to Vault</span>
              <p className="text-xs text-muted-foreground">Automatically backup encoded files</p>
            </div>
            <Switch
              checked={settings.autoSave}
              onCheckedChange={(checked) => setSettings({ ...settings, autoSave: checked })}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-muted-foreground">Max File Size (MB)</Label>
              <span className="text-xs text-neon-cyan">{settings.maxFileSize} MB</span>
            </div>
            <Slider
              value={[settings.maxFileSize]}
              onValueChange={(val) => setSettings({ ...settings, maxFileSize: val[0] })}
              min={10}
              max={500}
              step={10}
              className="py-2"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-foreground">Compress Images</span>
              <p className="text-xs text-muted-foreground">Reduce file size before upload</p>
            </div>
            <Switch
              checked={settings.compressImages}
              onCheckedChange={(checked) => setSettings({ ...settings, compressImages: checked })}
            />
          </div>
        </div>
      )
    },
    { 
      icon: Palette, 
      label: "Appearance", 
      desc: "Customize your interface experience",
      content: (
        <div className="mt-3 space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Theme Color</Label>
            <div className="flex gap-2 mt-2">
              {["cyan", "violet", "green", "orange", "pink"].map((color) => (
                <button
                  key={color}
                  onClick={() => setSettings({ ...settings, themeColor: color })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    settings.themeColor === color ? "border-white scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: `var(--neon-${color})` }}
                />
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Font Size</Label>
            <div className="flex gap-2 mt-2">
              {["small", "medium", "large"].map((size) => (
                <button
                  key={size}
                  onClick={() => setSettings({ ...settings, fontSize: size })}
                  className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all ${
                    settings.fontSize === size
                      ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-foreground">Dark Mode</span>
              <p className="text-xs text-muted-foreground">Cyberpunk aesthetic</p>
            </div>
            <Switch
              checked={settings.darkMode}
              onCheckedChange={(checked) => setSettings({ ...settings, darkMode: checked })}
            />
          </div>
        </div>
      )
    },
    { 
      icon: Globe, 
      label: "Language & Region", 
      desc: "Interface localization preferences",
      content: (
        <div className="mt-3">
          <select
            value={settings.language}
            onChange={(e) => setSettings({ ...settings, language: e.target.value })}
            className="w-full bg-muted/40 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-glow-cyan/50"
          >
            <option value="en">🇺🇸 English</option>
            <option value="es">🇪🇸 Español</option>
            <option value="fr">🇫🇷 Français</option>
            <option value="de">🇩🇪 Deutsch</option>
            <option value="ja">🇯🇵 日本語</option>
            <option value="zh">🇨🇳 中文</option>
          </select>
        </div>
      )
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-auto grid-bg">
      <header className="px-6 py-4 border-b border-border/30 glass-strong sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Settings</h2>
            <p className="text-xs text-muted-foreground font-mono">
              Configure encryption parameters and preferences
            </p>
          </div>
          <Button
            onClick={saveSettings}
            disabled={loading}
            size="sm"
            className="bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan border-glow-cyan"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </header>

      <div className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-4 pb-20">
        {settingsSections.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-lg p-5 hover:border-glow-violet transition-all duration-300 group"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <item.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground mb-2">{item.desc}</p>
                {item.content}
              </div>
            </div>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="pt-4 flex gap-3"
        >
          <Button
            onClick={saveSettings}
            disabled={loading}
            className="flex-1 bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan border-glow-cyan"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save All Settings"}
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-border/50 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              setSettings({
                encryptionLevel: "AES-256",
                autoSave: true,
                notifications: true,
                darkMode: true,
                language: "en",
                twoFactorAuth: false,
                sessionTimeout: 30,
                maxFileSize: 100,
                compressImages: true,
                backupFrequency: "daily",
                themeColor: "cyan",
                fontSize: "medium",
              });
              toast.info("Settings reset to defaults");
            }}
          >
            Reset to Defaults
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
