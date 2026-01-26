/**
 * Admin Layout Component
 * Wrapper with sidebar and content area
 */

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import styles from "./AdminLayout.module.css";

// Global admin font lock - ensures consistent font sizing across all devices
import "../../../styles/adminGlobal.css";

const AdminLayout = ({ children, pageTitle = "Dashboard" }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={styles.layout} data-admin="true">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className={`${styles.content} ${sidebarCollapsed ? styles.expanded : ""}`}>
        <Topbar pageTitle={pageTitle} />
        <div className={styles.pageContent}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
