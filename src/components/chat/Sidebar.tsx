import { useEffect } from "react";
import { Users } from "lucide-react";
import { useChatStore } from "@/hooks/useChatStore";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  return (
    <aside className="w-72 border-r border-border/30 glass-strong flex flex-col">
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-neon-cyan" />
          <span className="font-medium text-foreground">Contacts</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isUsersLoading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading contacts...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No contacts available</div>
        ) : (
          users.map((user) => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={`w-full p-3 flex items-center gap-3 rounded-lg transition-colors ${
                selectedUser?.id === user.id
                  ? "bg-neon-cyan/10 border-glow-cyan"
                  : "hover:bg-muted/40"
              }`}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-violet/20 to-neon-cyan/20 border border-border flex items-center justify-center">
                  <span className="text-sm font-semibold text-neon-violet">
                    {(user.full_name || user.email)[0].toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="font-medium text-sm text-foreground truncate">
                  {user.full_name || user.email}
                </div>
                <div className="text-xs text-muted-foreground">
                  {user.email}
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
