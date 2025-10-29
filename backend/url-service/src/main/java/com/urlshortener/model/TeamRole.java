package com.urlshortener.model;

public enum TeamRole {
    OWNER("Owner"),
    ADMIN("Admin"), 
    MEMBER("Member"),
    VIEWER("Viewer");
    
    private final String displayName;
    
    TeamRole(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public boolean canCreate() {
        return this != VIEWER;
    }
    
    public boolean canEditOwn() {
        return this != VIEWER;
    }
    
    public boolean canEditAll() {
        return this == OWNER || this == ADMIN;
    }
    
    public boolean canDelete() {
        return this == OWNER || this == ADMIN;
    }
    
    public boolean canInviteMembers() {
        return this == OWNER || this == ADMIN;
    }
    
    public boolean canRemoveMembers() {
        return this == OWNER || this == ADMIN;
    }
    
    public boolean canChangeRoles() {
        return this == OWNER;
    }
    
    public boolean canManageBilling() {
        return this == OWNER;
    }
    
    public boolean canDeleteTeam() {
        return this == OWNER;
    }
}