import React, { useState } from "react";

import Dashboard from "./Dashboard";
import Students from "./Students";
import Cases from "./Cases";
import Triage from "./Triage";

const pages = {
  dashboard: <Dashboard />,
  students: <Students />,
  cases: <Cases />,
  triage: <Triage />,
  documents: <div>Documents Page Content</div>,
  appointments: <div>Appointments Page Content</div>,
  contacts: <div>Contacts Page Content</div>,
  staff: <div>Staff Page Content</div>,
  emailTemplates: <div>Email Page Content</div>,
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<keyof typeof pages>("dashboard");

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw"}}>
      {/* Left Sidebar */}
      <div style={{ width: "200px", backgroundColor: "#f0f0f0", padding: "1rem", color: "black"}}>
        <h3>Pastoral Care</h3> 
        {Object.keys(pages).map((page) => (
          <div
            key={page}
            style={{
              padding: "0.5rem",
              cursor: "pointer",
              backgroundColor: currentPage === page ? "#ccc" : "transparent",
              
            }}
            onClick={() => setCurrentPage(page as keyof typeof pages)}
          >
            {page.charAt(0).toUpperCase() + page.slice(1)}
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%", overflow: "hidden" }}>
        {/* Top Buttons */}
        <div style={{ display: "flex", gap:  "20px", padding: "1rem", backgroundColor: "#e0e0e0", width: "100%"}}>
          <button>Table Settings</button>
          <button>Filter</button>
          <button>Import</button>
        </div>

        {/* Page Content */}
        <div style={{ flex: 1, padding: "2rem", textAlign: "center" }}>
          {pages[currentPage]}
        </div>

        {/* Bottom Buttons */}
        <div style={{ display: "flex", gap:  "20px", padding: "1rem", backgroundColor: "#e0e0e0", width: "100%" }}>
          <button>Add Student</button>
          <button>Add Case</button>
          <button>Add Appointment</button>
          <button>Import</button>
        </div>
      </div>
    </div>
  );
};

export default App;
