import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
} from "docx";

export interface ReportData {
  childId?: string;
  daysCount: number;
  activeDays: number;
  averageCompliance: number;
  habitBreakdown: Array<{
    id: string;
    name: string;
    category: string;
    completedCount: number;
    percentage: number;
  }>;
  notesHistory?: Array<{
    note: string;
    entry_date: string;
    author_role: string;
  }>;
  child?: {
    id?: string;
    fullName?: string;
    preferredName?: string;
    avatarUrl?: string | null;
    className?: string | null;
    teacherName?: string | null;
  };
  parent?: {
    id?: string;
    fullName?: string;
  };
}

export interface StudentInfo {
  id?: string;
  full_name?: string;
  preferred_name?: string;
  class_name?: string;
  grade_level?: string;
  school_name?: string;
  avatar_url?: string | null;
  teacher_name?: string | null;
  parent_name?: string | null;
}

export interface SchoolInfo {
  name?: string;
  logoUrl?: string | null;
}

export function getPredikat(pct: number): {
  label: string;
  text: string;
  cleanText: string;
  color: [number, number, number];
} {
  if (pct >= 85) {
    return {
      label: "MUMTAZ",
      text: "Mumtaz (Istimewa) 🌟",
      cleanText: "Mumtaz (Istimewa)",
      color: [16, 155, 131],
    };
  }
  if (pct >= 70) {
    return {
      label: "JAYYID JIDDAN",
      text: "Jayyid Jiddan (Sangat Baik) ✨",
      cleanText: "Jayyid Jiddan (Sangat Baik)",
      color: [14, 116, 144],
    };
  }
  if (pct >= 50) {
    return {
      label: "JAYYID",
      text: "Jayyid (Baik) 👍",
      cleanText: "Jayyid (Baik)",
      color: [217, 119, 6],
    };
  }
  return {
    label: "MAQBUL",
    text: "Perlu Bimbingan & Motivasi 📖",
    cleanText: "Perlu Bimbingan & Motivasi",
    color: [220, 38, 38],
  };
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// =============================================================================
// 1. EKSPOR RAPOR KE DOKUMEN PDF RESMI (A4 PORTRAIT - CLEAN NO-OVERLAP)
// =============================================================================

export async function exportReportToPDF(
  reportsData: ReportData,
  child: StudentInfo,
  schoolInfo?: SchoolInfo | null,
  periodDays: number = 30,
  signees?: { parentName?: string; teacherName?: string }
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const studentName = child?.full_name || "Ahmad Fauzan";
  const studentClass = child?.class_name || child?.grade_level || "Kelas 4A";
  const schoolName = schoolInfo?.name || child?.school_name || "SD Islam Sahabat Ibadah";
  const parentName = signees?.parentName || child?.parent_name || reportsData?.parent?.fullName || "Bunda Rina";
  const teacherName = signees?.teacherName || child?.teacher_name || reportsData?.child?.teacherName || "Pak Andi";
  const compliance = reportsData.averageCompliance || 0;
  const predikat = getPredikat(compliance);
  const printDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // --- KOP SEKOLAH & HEADER LAPORAN ---
  doc.setFillColor(16, 155, 131); // #109B83
  doc.rect(0, 0, pageWidth, 5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(22, 75, 68); // #164B44
  doc.text(schoolName.toUpperCase(), pageWidth / 2, 16, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(90, 120, 115);
  doc.text(
    "LAPORAN HASIL EVALUASI MUTABA'AH AMALAN & KARAKTER SISWA DI RUMAH",
    pageWidth / 2,
    21,
    { align: "center" }
  );

  doc.setDrawColor(200, 230, 222);
  doc.setLineWidth(0.5);
  doc.line(14, 24, pageWidth - 14, 24);

  // --- KOTAK INFORMASI SISWA (METADATA CARD DENGAN SPACING LEGA & AMAN) ---
  // Tinggi kotak 34mm (Y: 27 s/d 61), Lebar 182mm (X: 14 s/d 196)
  doc.setFillColor(244, 251, 248); // #F4FBF8
  doc.roundedRect(14, 27, pageWidth - 28, 34, 3, 3, "F");
  doc.setDrawColor(205, 235, 225);
  doc.roundedRect(14, 27, pageWidth - 28, 34, 3, 3, "S");

  // Kolom Kiri: Label di X=18, Nilai di X=46 (Maks lebar ~60mm, batas aman X=110)
  // Kolom Kanan: Label di X=114, Nilai di X=148 (Batas aman X=192)
  doc.setFontSize(8.5);

  // Baris 1 (Y = 34)
  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 140, 135);
  doc.text("Nama Siswa:", 18, 34);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 70, 62);
  doc.text(studentName, 46, 34);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 140, 135);
  doc.text("Periode Rapor:", 114, 34);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 70, 62);
  doc.text(`${periodDays} Hari Terakhir`, 148, 34);

  // Baris 2 (Y = 41)
  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 140, 135);
  doc.text("Kelas / Tingkat:", 18, 41);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 70, 62);
  doc.text(studentClass, 46, 41);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 140, 135);
  doc.text("Hari Aktif:", 114, 41);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 155, 131);
  doc.text(`${reportsData.activeDays || 0} dari ${periodDays} Hari`, 148, 41);

  // Baris 3 (Y = 48) - Rata-rata Kepatuhan & Tanggal Cetak (Terpisah secara absolut)
  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 140, 135);
  doc.text("Kepatuhan:", 18, 48);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(predikat.color[0], predikat.color[1], predikat.color[2]);
  doc.text(`${compliance}% — ${predikat.cleanText}`, 46, 48);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 140, 135);
  doc.text("Tanggal Cetak:", 114, 48);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(50, 80, 75);
  doc.text(printDate, 148, 48);

  // Baris 4 (Y = 55) - Nama Guru & Nama Orang Tua
  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 140, 135);
  doc.text("Wali Kelas:", 18, 55);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 70, 62);
  doc.text(teacherName, 46, 55);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 140, 135);
  doc.text("Orang Tua / Wali:", 114, 55);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 70, 62);
  doc.text(parentName, 148, 55);

  // --- TABEL REKAPITULASI IBADAH (AUTOTABLE) ---
  const tableData = (reportsData.habitBreakdown || []).map((h, index) => {
    const itemPredikat = getPredikat(h.percentage);
    return [
      (index + 1).toString(),
      h.name,
      h.category.toUpperCase(),
      `${h.completedCount} / ${periodDays} Hari`,
      `${h.percentage}%`,
      itemPredikat.cleanText,
    ];
  });

  autoTable(doc, {
    startY: 65,
    margin: { left: 14, right: 14 },
    head: [["No", "Nama Ibadah & Amalan", "Kategori", "Terlaksana", "Persentase", "Predikat"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [16, 155, 131],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "center",
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.6,
      textColor: [30, 60, 55],
      lineColor: [225, 238, 234],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { halign: "left", fontStyle: "bold" },
      2: { halign: "center", cellWidth: 32 },
      3: { halign: "center", cellWidth: 30 },
      4: { halign: "center", cellWidth: 24, fontStyle: "bold" },
      5: { halign: "center", cellWidth: 36, fontStyle: "bold" },
    },
    alternateRowStyles: {
      fillColor: [248, 252, 250],
    },
  });

  let currentY = (doc as any).lastAutoTable.finalY + 6;

  // --- CATATAN EVALUASI GURU (JIKA ADA) ---
  if (reportsData.notesHistory && reportsData.notesHistory.length > 0) {
    const note = reportsData.notesHistory[0];
    doc.setFillColor(252, 254, 253);
    doc.roundedRect(14, currentY, pageWidth - 28, 14, 2, 2, "F");
    doc.setDrawColor(220, 238, 232);
    doc.roundedRect(14, currentY, pageWidth - 28, 14, 2, 2, "S");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(18, 85, 70);
    doc.text("Catatan Evaluasi Guru:", 18, currentY + 5);

    doc.setFont("helvetica", "italic");
    doc.setTextColor(60, 90, 85);
    const splitNote = doc.splitTextToSize(`"${note.note}" (${note.entry_date})`, pageWidth - 40);
    doc.text(splitNote, 18, currentY + 10);

    currentY += 18;
  } else {
    currentY += 4;
  }

  // Cek jika butuh halaman baru untuk tanda tangan
  if (currentY > 232) {
    doc.addPage();
    currentY = 25;
  }

  // --- BLOK TANDA TANGAN RESMI DENGAN NAMA OTOMATIS ---
  const signColWidth = (pageWidth - 28) / 2;

  // Kolom Kiri: Orang Tua / Wali
  const leftX = 14 + signColWidth / 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 110, 105);
  doc.text("Mengetahui,", leftX, currentY, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 65, 58);
  doc.text("Orang Tua / Wali Murid", leftX, currentY + 5, { align: "center" });

  // Nama Orang Tua di atas garis tanda tangan
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(18, 65, 55);
  doc.text(`( ${parentName} )`, leftX, currentY + 24, { align: "center" });

  doc.setDrawColor(30, 75, 65);
  doc.setLineWidth(0.3);
  doc.line(leftX - 35, currentY + 26, leftX + 35, currentY + 26);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(120, 145, 140);
  doc.text("Nama Terang & Tanda Tangan", leftX, currentY + 30, { align: "center" });

  // Kolom Kanan: Guru Pembimbing / Wali Kelas
  const rightX = 14 + signColWidth + signColWidth / 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 110, 105);
  doc.text(`${schoolName}, ${printDate}`, rightX, currentY, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 65, 58);
  doc.text("Guru Pembimbing / Wali Kelas", rightX, currentY + 5, { align: "center" });

  // Nama Guru di atas garis tanda tangan
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(18, 65, 55);
  doc.text(`( ${teacherName} )`, rightX, currentY + 24, { align: "center" });

  doc.setDrawColor(30, 75, 65);
  doc.setLineWidth(0.3);
  doc.line(rightX - 35, currentY + 26, rightX + 35, currentY + 26);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(120, 145, 140);
  doc.text("Nama Terang & Tanda Tangan", rightX, currentY + 30, { align: "center" });

  // Footer Dokumen
  doc.setFontSize(7);
  doc.setTextColor(140, 165, 160);
  doc.text(
    `Sahabat Ibadah · Rapor Mutaba'ah Resmi · Tercetak otomatis pada ${printDate}`,
    pageWidth / 2,
    288,
    { align: "center" }
  );

  const filename = `Rapor_Mutabaah_${sanitizeFileName(studentName)}_${periodDays}Hari.pdf`;
  doc.save(filename);
}

// =============================================================================
// 2. EKSPOR RAPOR KE DOKUMEN MICROSOFT WORD (.DOCX) ASLI & AISTETIK
// =============================================================================

export async function exportReportToWord(
  reportsData: ReportData,
  child: StudentInfo,
  schoolInfo?: SchoolInfo | null,
  periodDays: number = 30,
  signees?: { parentName?: string; teacherName?: string }
) {
  const studentName = child?.full_name || "Ahmad Fauzan";
  const studentClass = child?.class_name || child?.grade_level || "Kelas 4A";
  const schoolName = schoolInfo?.name || child?.school_name || "SD Islam Sahabat Ibadah";
  const parentName = signees?.parentName || child?.parent_name || reportsData?.parent?.fullName || "Bunda Rina";
  const teacherName = signees?.teacherName || child?.teacher_name || reportsData?.child?.teacherName || "Pak Andi";
  const compliance = reportsData.averageCompliance || 0;
  const predikat = getPredikat(compliance);
  const printDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Susun baris tabel rekapitulasi untuk dokumen Word
  const habitTableRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 600, type: WidthType.DXA },
          shading: { fill: "109B83" },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "No", bold: true, color: "FFFFFF", size: 18 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 3600, type: WidthType.DXA },
          shading: { fill: "109B83" },
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [new TextRun({ text: "Nama Ibadah & Amalan", bold: true, color: "FFFFFF", size: 18 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 1800, type: WidthType.DXA },
          shading: { fill: "109B83" },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Kategori", bold: true, color: "FFFFFF", size: 18 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 1600, type: WidthType.DXA },
          shading: { fill: "109B83" },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Terlaksana", bold: true, color: "FFFFFF", size: 18 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 1300, type: WidthType.DXA },
          shading: { fill: "109B83" },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Persentase", bold: true, color: "FFFFFF", size: 18 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 1500, type: WidthType.DXA },
          shading: { fill: "109B83" },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Predikat", bold: true, color: "FFFFFF", size: 18 })],
            }),
          ],
        }),
      ],
    }),
  ];

  (reportsData.habitBreakdown || []).forEach((h, idx) => {
    const itemPred = getPredikat(h.percentage);
    const bgFill = idx % 2 === 1 ? "F8FCFA" : "FFFFFF";

    habitTableRows.push(
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: bgFill },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: (idx + 1).toString(), size: 18 })],
              }),
            ],
          }),
          new TableCell({
            shading: { fill: bgFill },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [new TextRun({ text: h.name, bold: true, color: "185347", size: 18 })],
              }),
            ],
          }),
          new TableCell({
            shading: { fill: bgFill },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: h.category.toUpperCase(), color: "658F85", size: 16 })],
              }),
            ],
          }),
          new TableCell({
            shading: { fill: bgFill },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `${h.completedCount} / ${periodDays} Hari`, size: 18 })],
              }),
            ],
          }),
          new TableCell({
            shading: { fill: bgFill },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `${h.percentage}%`, bold: true, color: "0A846C", size: 18 })],
              }),
            ],
          }),
          new TableCell({
            shading: { fill: bgFill },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: itemPred.cleanText, bold: true, color: "164E43", size: 16 })],
              }),
            ],
          }),
        ],
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1000,
              right: 1000,
            },
          },
        },
        children: [
          // Header Dokumen
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: schoolName.toUpperCase(),
                bold: true,
                color: "109B83",
                size: 28,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "LAPORAN HASIL EVALUASI MUTABA'AH AMALAN & KARAKTER SISWA DI RUMAH",
                bold: true,
                color: "557770",
                size: 18,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Periode Rekapitulasi: ${periodDays} Hari Terakhir · Dicetak: ${printDate}`,
                color: "78948E",
                size: 16,
              }),
            ],
            spacing: { after: 240 },
          }),

          // Metadata Siswa (Tabel 2 Kolom Shaded Selaras PDF)
          new Table({
            width: { size: 10400, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: "CDE7DF" },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "CDE7DF" },
              left: { style: BorderStyle.SINGLE, size: 4, color: "CDE7DF" },
              right: { style: BorderStyle.SINGLE, size: 4, color: "CDE7DF" },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 5200, type: WidthType.DXA },
                    shading: { fill: "F4FBF8" },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Nama Siswa: ", color: "7A9B94", size: 18 }),
                          new TextRun({ text: studentName, bold: true, color: "174E46", size: 18 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Kelas / Tingkat: ", color: "7A9B94", size: 18 }),
                          new TextRun({ text: studentClass, bold: true, color: "174E46", size: 18 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Kepatuhan: ", color: "7A9B94", size: 18 }),
                          new TextRun({ text: `${compliance}% — ${predikat.cleanText}`, bold: true, color: "0A846C", size: 18 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Wali Kelas: ", color: "7A9B94", size: 18 }),
                          new TextRun({ text: teacherName, bold: true, color: "174E46", size: 18 }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 5200, type: WidthType.DXA },
                    shading: { fill: "F4FBF8" },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Periode Rapor: ", color: "7A9B94", size: 18 }),
                          new TextRun({ text: `${periodDays} Hari Terakhir`, bold: true, color: "174E46", size: 18 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Hari Aktif: ", color: "7A9B94", size: 18 }),
                          new TextRun({ text: `${reportsData.activeDays || 0} dari ${periodDays} Hari`, bold: true, color: "109B83", size: 18 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Tanggal Cetak: ", color: "7A9B94", size: 18 }),
                          new TextRun({ text: printDate, bold: true, color: "174E46", size: 18 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Orang Tua / Wali: ", color: "7A9B94", size: 18 }),
                          new TextRun({ text: parentName, bold: true, color: "174E46", size: 18 }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 200 } }),

          // Tabel Rekapitulasi Amalan
          new Table({
            width: { size: 10400, type: WidthType.DXA },
            rows: habitTableRows,
          }),

          // Catatan Evaluasi Guru Jika Ada
          ...(reportsData.notesHistory && reportsData.notesHistory.length > 0
            ? [
                new Paragraph({ text: "", spacing: { after: 160 } }),
                new Table({
                  width: { size: 10400, type: WidthType.DXA },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 4, color: "D4ECE5" },
                    bottom: { style: BorderStyle.SINGLE, size: 4, color: "D4ECE5" },
                    left: { style: BorderStyle.SINGLE, size: 12, color: "109B83" },
                    right: { style: BorderStyle.SINGLE, size: 4, color: "D4ECE5" },
                    insideHorizontal: { style: BorderStyle.NONE },
                    insideVertical: { style: BorderStyle.NONE },
                  },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          shading: { fill: "F8FCFA" },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Catatan Evaluasi Guru Terakhir:",
                                  bold: true,
                                  color: "109B83",
                                  size: 18,
                                }),
                              ],
                            }),
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: `"${reportsData.notesHistory[0].note}"`,
                                  italics: true,
                                  color: "33554F",
                                  size: 17,
                                }),
                                new TextRun({
                                  text: ` — ${reportsData.notesHistory[0].entry_date} (Guru Wali Kelas)`,
                                  color: "7A9B94",
                                  size: 15,
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ]
            : []),

          new Paragraph({ text: "", spacing: { after: 300 } }),

          // Kolom Tanda Tangan Resmi
          new Table({
            width: { size: 10400, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 5200, type: WidthType.DXA },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "Mengetahui,", size: 18, color: "668880" })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "Orang Tua / Wali Murid", bold: true, size: 20, color: "164E43" })],
                      }),
                      new Paragraph({ text: "", spacing: { after: 600 } }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: `( ${parentName} )`, bold: true, size: 20, color: "164E43" })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "Nama Terang & Tanda Tangan", size: 14, color: "88AAA2" })],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 5200, type: WidthType.DXA },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: `${schoolName}, ${printDate}`, size: 18, color: "668880" })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "Guru Pembimbing / Wali Kelas", bold: true, size: 20, color: "164E43" })],
                      }),
                      new Paragraph({ text: "", spacing: { after: 600 } }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: `( ${teacherName} )`, bold: true, size: 20, color: "164E43" })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "Nama Terang & Tanda Tangan", size: 14, color: "88AAA2" })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `Rapor_Mutabaah_${sanitizeFileName(studentName)}_${periodDays}Hari.docx`;
  downloadBlob(blob, filename);
}

// =============================================================================
// 3. EKSPOR RAPOR KE CSV UTF-8 DENGAN BOM EXCEL
// =============================================================================

export function exportReportToCSV(
  reportsData: ReportData,
  child: StudentInfo,
  periodDays: number = 30,
  signees?: { parentName?: string; teacherName?: string }
) {
  const studentName = child?.full_name || "Ahmad Fauzan";
  const studentClass = child?.class_name || child?.grade_level || "Kelas 4A";
  const schoolName = child?.school_name || "SD Islam Sahabat Ibadah";
  const parentName = signees?.parentName || child?.parent_name || reportsData?.parent?.fullName || "Bunda Rina";
  const teacherName = signees?.teacherName || child?.teacher_name || reportsData?.child?.teacherName || "Pak Andi";
  const printDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const metaRows = [
    `"RAPOR MUTABA'AH IBADAH SISWA"`,
    `"Sekolah","${schoolName}"`,
    `"Nama Siswa","${studentName}"`,
    `"Kelas","${studentClass}"`,
    `"Wali Kelas","${teacherName}"`,
    `"Orang Tua / Wali","${parentName}"`,
    `"Periode","${periodDays} Hari Terakhir"`,
    `"Rata-rata Kepatuhan","${reportsData.averageCompliance || 0}%"`,
    `"Tanggal Cetak","${printDate}"`,
    "",
  ];

  const header = [
    "No",
    "Amalan Ibadah",
    "Kategori",
    "Hari Terlaksana",
    `Total Hari (${periodDays})`,
    "Persentase (%)",
    "Predikat",
  ];

  const dataRows = (reportsData.habitBreakdown || []).map((h, idx) => [
    idx + 1,
    `"${h.name}"`,
    h.category,
    h.completedCount,
    periodDays,
    `${h.percentage}%`,
    getPredikat(h.percentage).cleanText,
  ]);

  const csvContent =
    "\uFEFF" +
    metaRows.join("\n") +
    [header.join(","), ...dataRows.map((r) => r.join(","))].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const filename = `Rapor_Mutabaah_${sanitizeFileName(studentName)}_${periodDays}Hari.csv`;
  downloadBlob(blob, filename);
}
