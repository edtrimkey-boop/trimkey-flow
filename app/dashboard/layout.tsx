"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { LiquidGlass } from '@/components/ui/LiquidGlass';
import { usePathname } from "next/navigation";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isNotifOpen, setNotifOpen] = useState(false);
  const [isFabOpen, setFabOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const previousPathname = useRef(pathname);

  const [profileData, setProfileData] = useState({
    user_name: 'Admin User',
    user_email: 'admin@trimkey.in',
    organization_name: 'Trim Key Corp'
  });

  useEffect(() => {
    fetch('/api/profile').then(res => res.json()).then(data => {
      if (data) setProfileData(data);
    }).catch(console.error);
  }, []);

  // Close dropdowns when clicking outside
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
    if (previousPathname.current !== pathname) {
      
      previousPathname.current = pathname;
    }
  }, [pathname]);

  const toggleSidebar = () => {
    if (window.innerWidth > 950) {
      setSidebarCollapsed(!isSidebarCollapsed);
    } else {
      setMobileSidebarOpen(!isMobileSidebarOpen);
    }
  };

  const navItems = [
    { name: "Overview", path: "/dashboard", icon: <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" /> },
    { name: "Transactions", path: "/dashboard/transactions", icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></> },
      { name: "Smart Router", path: "/dashboard/router", icon: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><line x1="12" y1="22" x2="12" y2="12"></line></> },
    { name: "Merchants", path: "/dashboard/merchants", icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></> },
    { name: "Applications", path: "/dashboard/applications", icon: <><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></> },
    { name: "API Keys", path: "/dashboard/api-keys", icon: <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /> },
    { name: "Webhooks", path: "/dashboard/webhooks", icon: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></> },
    { name: "Domains", path: "/dashboard/domains", icon: <><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></> },
    { name: "Docs", path: "/dashboard/docs", icon: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></> },
    { name: "Settings", path: "/dashboard/settings", icon: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></> },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground relative">
      
      {/* ================= SIDEBAR ================= */}
      <aside 
        className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""} ${isMobileSidebarOpen ? "open" : ""}`} 
        id="sidebar"
      >
        <div style={{ marginBottom: 40, padding: "0 25px", display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }} className="brandRow">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Trim Key Flow Logo Icon */}
            <div className="flex h-9 w-9 items-center justify-center rounded-lg">
                <img onError={(e) => { e.currentTarget.style.display = "none"; }} className="logo" style={{ width: '50px', height: '50px', borderRadius: '16px', objectFit: 'contain', background: 'white', padding: '2px' }} src="https://ypmnsgpohaaavbjdqjye.supabase.co/storage/v1/object/public/logo/new-ETK.png" />
            </div>
            <div className="brand" style={{ fontSize: 16, color: 'white', lineHeight: 1.2 }}>Trim Key Flow</div>
          </div>
          <button className="mobile-close-btn liquid-glass glass-circle-btn" onClick={toggleSidebar}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
            return (
              <Link prefetch={true} href={item.path} key={item.path} className={`nav-item ${isActive ? "active" : ""}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 0 }}>
                  {item.icon}
                </svg>
                {item.name}
              </Link>
            );
          })}
        </div>

        <div style={{ marginTop: "auto", padding: "20px 30px", fontSize: 11, color: "var(--text-muted)", fontWeight: 600, borderTop: "1px solid var(--border)" }}>
          Version V1.0.0 (TK FLOW)
        </div>
      </aside>

      {/* ================= MAIN WRAPPER ================= */}
      <div className="main-wrapper">
        <div className="header-scrim"></div>
        
        {/* TOP BAR */}
        <LiquidGlass as="header" className="top-bar" scale={-90} chroma={4}>
          <div className="brandRow">
            {/* Hamburger Button */}
            <button className="liquid-glass glass-circle-btn" onClick={toggleSidebar} style={{ marginRight: 10 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            
            {/* Isolated Glass Pill */}
            <div className="glass-title-pill brand">
              <span className="desktop-only" style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 800, letterSpacing: 0.5, display: "none" }}>Flow Workspace</span>
              <div className="title-separator desktop-only" style={{ display: "none" }}></div>
              <span id="top-title" style={{ fontSize: 14, color: "var(--text)", fontWeight: 900, letterSpacing: 0.5, textTransform: "uppercase" }}>
                {navItems.find(i => pathname === i.path)?.name || "Dashboard"}
              </span>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
            {/* Notification Bell */}
            <div ref={notifRef} className="liquid-glass glass-circle-btn notification-wrapper flex" onClick={() => setNotifOpen(!isNotifOpen)} style={{ borderColor: "transparent" }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
              <span className="notification-badge" style={{ display: "flex" }}>3</span>
              
              <div className={`notif-dropdown ${isNotifOpen ? "active" : ""}`} onClick={(e) => e.stopPropagation()}>
                <div className="notif-header">
                  <span>System Alerts</span>
                  <span style={{ fontSize: 10, color: "var(--brand)", cursor: "pointer" }}>Mark all read</span>
                </div>
                <div className="notif-list">
                  <div className="notif-item bg-brand/5">
                    <div className="notif-title text-brand">Webhook Delivery Failed</div>
                    <div className="notif-msg">Endpoint missing for payment.captured event.</div>
                    <div className="notif-time">2 mins ago</div>
                  </div>
                </div>
              </div>
            </div>

            {/* User Profile Dropdown */}
            <div ref={profileRef} className={`liquid-glass user-profile-container flex ${isProfileOpen ? "active" : ""}`} onClick={() => setProfileOpen(!isProfileOpen)} style={{ padding: "6px 16px 6px 6px" }}>
              <div className="avatar-circle bg-gradient-to-br from-brand to-[#059669]">{profileData.user_name ? profileData.user_name.charAt(0).toUpperCase() : "A"}</div>
              <div className="desktop-only" style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{profileData.user_name}</span>
              </div>
              <span className="profile-chevron" style={{ color: "var(--text-muted)", marginLeft: 10 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </span>
              
              <div className={`profile-dropdown ${isProfileOpen ? "active" : ""}`} onClick={(e) => e.stopPropagation()}>
                <div className="dropdown-header">
                  <div style={{ fontSize: 16, fontWeight: 800, color: "white" }}>{profileData.user_name}</div>
                  <div className="dropdown-email">{profileData.user_email}</div>
                  <div className="dropdown-role bg-brand/10 text-brand">System Admin</div>
                    <div className="dropdown-org" style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Organisation</div>
                      <div style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>{profileData.organization_name}</div>
                    </div>
                </div>

                <Link prefetch={true} href="/dashboard/settings?tab=profile" className="dropdown-menu-item" onClick={() => setProfileOpen(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    Edit Profile
                  </Link>
                  <Link prefetch={true} href="/dashboard/settings" className="dropdown-menu-item" onClick={() => setProfileOpen(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  API Configuration
                </Link>

                <hr style={{ border: 0, borderBottom: "1px solid rgba(255,255,255,0.08)", margin: "12px 0" }} />
                
                <button className="logout-btn border-danger/20 bg-danger/5 text-danger hover:bg-gradient-to-br hover:from-danger hover:to-[#B91C1C] hover:text-white">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                  Secure Sign Out
                </button>
              </div>
            </div>
          </div>
        </LiquidGlass>

              {/* Sync Loader */}
      <div id="syncLoader" className={`glass-overlay ${isNavigating ? 'active' : ''}`} style={{ zIndex: 9999, opacity: isNavigating ? 1 : 0, pointerEvents: isNavigating ? 'all' : 'none', transition: 'opacity 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: "center" }}>
          <div className="brandRow" style={{ marginBottom: "20px", justifyContent: "center" }}>
            <img className="logo" style={{ width: '65px', height: '65px', borderRadius: '16px', objectFit: 'contain', background: 'white', padding: '2px' }} src="https://ypmnsgpohaaavbjdqjye.supabase.co/storage/v1/object/public/logo/new-ETK.png" />
          </div>
          <h3 style={{ color: "white", letterSpacing: "3px", fontSize: "14px", marginBottom: 0, fontWeight: 800 }}>SYNCING DATABASE...</h3>
          <div className="loading-bar-container" style={{ width: '200px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', margin: '15px auto 0' }}><div className="loading-bar" style={{ width: '50%', height: '100%', background: 'var(--brand)', animation: 'loading 1s infinite ease-in-out' }}></div></div>
        </div>
      </div>

        {/* CONTENT AREA */}
        <div className="content-area">
          {children}
        </div>
      </div>

      {/* ================= MOBILE BOTTOM NAV (APPLE STYLE) ================= */}
      <div id="mobile-nav-bar" className="flex md:hidden">
        <div className="nav-pill-box">
          <Link prefetch={true} href="/dashboard" className={`nav-tab ${pathname === '/dashboard' ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/></svg>
            Home
          </Link>
          
          <Link prefetch={true} href="/dashboard/merchants" className={`nav-tab ${pathname.includes('/merchants') ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            Clients
          </Link>
          <Link prefetch={true} href="/dashboard/settings" className={`nav-tab ${pathname.includes('/settings') ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
            Config
          </Link>
        </div>
        
        {/* Floating Action Button (FAB) Dock */}
        <div className={`fab-dock ${isFabOpen ? 'open' : ''}`} onClick={() => setFabOpen(!isFabOpen)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
      </div>

      {/* FAB Action Sheet Overlay */}
      <div 
        className={`glass-overlay ${isFabOpen ? 'active' : ''} md:hidden`} 
        style={{ zIndex: 4998 }} 
        onClick={() => setFabOpen(false)}
      ></div>

      {/* FAB Action Sheet Menu */}
      <div id="fab-action-sheet" className={isFabOpen ? 'active' : ''}>
        <div className="fab-grid">
          <div className="fab-item text-brand hover:bg-brand/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create Payment Link
          </div>
          <div className="fab-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
            Generate API Key
          </div>
          <div className="fab-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
            Register Application
          </div>
        </div>
      </div>

    </div>
  );
}















