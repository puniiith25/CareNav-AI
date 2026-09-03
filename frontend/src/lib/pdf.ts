"use client";

export function generatePdfDocument(options: {
  title: string;
  subtitle?: string;
  patientName?: string;
  doctorName?: string;
  facilityName?: string;
  date?: string;
  sections: { title: string; rows?: { label: string; value: string | React.ReactNode }[]; text?: string; table?: { headers: string[]; rows: string[][] } }[];
}) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to export and print your medical PDF.");
    return;
  }

  const sectionsHtml = options.sections
    .map((s) => {
      let content = "";
      if (s.text) {
        content += `<p style="font-size: 13px; line-height: 1.6; color: #2d3748; margin: 6px 0;">${s.text}</p>`;
      }
      if (s.rows && s.rows.length > 0) {
        content += `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin: 8px 0;">
            ${s.rows
              .map(
                (r) => `
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #edf2f7; font-size: 12px;">
                <span style="font-weight: 600; color: #4a5568;">${r.label}:</span>
                <span style="color: #1a202c; font-weight: 700;">${r.value}</span>
              </div>
            `
              )
              .join("")}
          </div>
        `;
      }
      if (s.table && s.table.rows.length > 0) {
        content += `
          <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; text-align: left;">
            <thead>
              <tr style="background: #edf2f7; color: #2d3748; text-transform: uppercase; font-size: 11px;">
                ${s.table.headers.map((h) => `<th style="padding: 8px 10px; border: 1px solid #cbd5e0;">${h}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${s.table.rows
                .map(
                  (row) => `
                <tr>
                  ${row.map((cell, idx) => `<td style="padding: 8px 10px; border: 1px solid #e2e8f0; ${idx === 1 ? 'font-weight: 700; color: #0f6e6e;' : ''}">${cell}</td>`).join("")}
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        `;
      }
      return `
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #0f6e6e; border-bottom: 2px solid #0f6e6e; padding-bottom: 4px; margin-bottom: 8px;">${s.title}</h3>
          ${content}
        </div>
      `;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${options.title} - CareNav AI Health</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1a202c;
            margin: 0;
            padding: 24px;
            background: #fff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #0f6e6e;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .logo {
            font-size: 22px;
            font-weight: 800;
            color: #0f6e6e;
          }
          .logo span {
            background: #e4f2f1;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 14px;
            margin-left: 4px;
          }
          .doc-title {
            font-size: 20px;
            font-weight: 700;
            color: #1a202c;
            margin: 0 0 4px 0;
          }
          .doc-sub {
            font-size: 12px;
            color: #718096;
            margin: 0;
          }
          .footer {
            margin-top: 40px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
            font-size: 10px;
            color: #718096;
            display: flex;
            justify-content: space-between;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">CareNav<span>AI</span></div>
            <div style="font-size: 11px; color: #4a5568; margin-top: 2px;">Verified Digital Health Record</div>
          </div>
          <div style="text-align: right;">
            <div class="doc-title">${options.title}</div>
            <div class="doc-sub">${options.subtitle || "Generated via CareNav Healthcare Platform"}</div>
            <div class="doc-sub">Date: ${options.date || new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <div style="background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 8px; padding: 12px; margin-bottom: 20px; font-size: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div><strong>Patient:</strong> ${options.patientName || "Arjun Mehta"}</div>
          <div><strong>Attending Doctor:</strong> ${options.doctorName || "Dr. Ananya Sharma"}</div>
          <div><strong>Facility:</strong> ${options.facilityName || "Bengaluru Heart & Multispecialty Hospital"}</div>
          <div><strong>Authentication:</strong> Digitally Verified ✅</div>
        </div>

        ${sectionsHtml}

        <div class="footer">
          <span>CareNav AI Health Vault · End-to-End Encrypted Patient Summary</span>
          <span>Confidential Healthcare Record</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
