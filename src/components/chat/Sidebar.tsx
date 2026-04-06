import { useState, useEffect } from "react";
import { Users, UserPlus, Mail } from "lucide-react";
import { useChatStore } from "@/hooks/useChatStore";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Sidebar = () => {
  const { 
    getContacts, 
    contacts, 
    selectedUser, 
    setSelectedUser, 
    isUsersLoading,
    addContactByEmail,
    currentUserId
  } = useChatStore();
  
  const [searchEmail, setSearchEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);

  useEffect(() => {
    getContacts();
  }, [getContacts]);

  const handleAddContact = async () => {
    if (!searchEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsSearching(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, avatar_url')
        .eq('email', searchEmail.trim().toLowerCase());

      if (error) throw error;

      const profile = profiles?.[0];
      if (!profile) {
        toast.error("No user found with this email address");
        return;
      }

      if (profile.user_id === currentUserId) {
        toast.error("You cannot add yourself as a contact");
        return;
      }

      if (contacts.some(c => c.id === profile.user_id)) {
        toast.info("This user is already in your contacts");
        return;
      }

      await addContactByEmail({
        id: profile.user_id,
        email: profile.email || "",
        full_name: profile.full_name || undefined,
        avatar_url: profile.avatar_url || undefined,
      });

      toast.success(`Added ${profile.email} to contacts`);
      setSearchEmail("");
      setShowAddContact(false);
    } catch (error) {
      console.error("Error adding contact:", error);
      toast.error("Failed to add contact");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <aside className="w-72 border-r border-border/30 glass-strong flex flex-col">
      <div className="p-4 border-b border-border/30 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-neon-cyan" />
          <span className="font-medium text-foreground">Contacts</span>
        </div>
        
        {!showAddContact ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
            onClick={() => setShowAddContact(true)}
          >
            <UserPlus className="w-3 h-3" />
            Add Contact by Email
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="Enter user email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddContact()}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/50"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1 text-xs border-neon-cyan/30 text-neon-cyan"
                onClick={handleAddContact}
                disabled={isSearching}
              >
                {isSearching ? "Searching..." : "Add"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => { setShowAddContact(false); setSearchEmail(""); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isUsersLoading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading contacts...</div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No contacts yet. Add someone by email!
          </div>
        ) : (
          contacts.map((user) => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={`w-full p-3 flex items-center gap-3 rounded-lg transition-colors ${
                selectedUser?.id === user.id
                  ? "bg-neon-cyan/10 border border-neon-cyan/30"
                  : "hover:bg-muted/40"
              }`}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-violet/20 to-neon-cyan/20 border border-border flex items-center justify-center">
                  <span className="text-sm font-semibold text-neon-violet">
                    {(user.full_name || user.email || "?")[0].toUpperCase()}
                  </span>
                </div>
                {user.is_online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-neon-green rounded-full border-2 border-secondary" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="font-medium text-sm text-foreground truncate">
                  {user.full_name || (user.email ? user.email.split('@')[0] : "Unknown")}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {user.email || "No email"}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
