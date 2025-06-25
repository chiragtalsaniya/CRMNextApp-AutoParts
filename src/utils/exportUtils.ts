import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { Order, OrderStatus } from '../types';

interface ReportData {
  orders: Order[];
  filters: any;
  stats: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    statusCounts: Record<OrderStatus, number>;
  };
  generatedAt: string;
}

export const exportToExcel = async (data: ReportData, filename: string) => {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ['Order Report Summary'],
    ['Generated At', format(new Date(data.generatedAt), 'PPpp')],
    ['Date Range', `${data.filters.startDate} to ${data.filters.endDate}`],
    ['Status Filter', data.filters.status === 'all' ? 'All Status' : data.filters.status],
    [],
    ['Statistics'],
    ['Total Orders', data.stats.totalOrders],
    ['Total Revenue', `$${data.stats.totalRevenue.toFixed(2)}`],
    ['Average Order Value', `$${data.stats.avgOrderValue.toFixed(2)}`],
    [],
    ['Status Breakdown'],
    ...Object.entries(data.stats.statusCounts).map(([status, count]) => [
      status.charAt(0).toUpperCase() + status.slice(1),
      count
    ])
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Orders Sheet
  const ordersData = [
    ['Order ID', 'Date', 'Status', 'Items Count', 'Total Price', 'Item Details']
  ];

  data.orders.forEach(order => {
    const itemDetails = order.items.map(item => 
      `${item.part_name} (Qty: ${item.quantity}, Price: $${item.price_per_unit})`
    ).join('; ');

    ordersData.push([
      order.id,
      format(new Date(order.created_at), 'yyyy-MM-dd HH:mm'),
      order.status,
      order.items.length,
      order.total_price,
      itemDetails
    ]);
  });

  const ordersSheet = XLSX.utils.aoa_to_sheet(ordersData);
  
  // Auto-size columns
  const colWidths = [
    { wch: 15 }, // Order ID
    { wch: 20 }, // Date
    { wch: 12 }, // Status
    { wch: 10 }, // Items Count
    { wch: 12 }, // Total Price
    { wch: 50 }  // Item Details
  ];
  ordersSheet['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Orders');

  // Order Items Detail Sheet
  const itemsData = [
    ['Order ID', 'Part Name', 'Quantity', 'Unit Price', 'Total Price', 'Order Date', 'Order Status']
  ];

  data.orders.forEach(order => {
    order.items.forEach(item => {
      itemsData.push([
        order.id,
        item.part_name || 'Unknown Part',
        item.quantity,
        item.price_per_unit,
        item.quantity * item.price_per_unit,
        format(new Date(order.created_at), 'yyyy-MM-dd'),
        order.status
      ]);
    });
  });

  const itemsSheet = XLSX.utils.aoa_to_sheet(itemsData);
  itemsSheet['!cols'] = [
    { wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Order Items');

  // Write file
  XLSX.writeFile(workbook, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

export const exportToPDF = async (data: ReportData, filename: string) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(0, 51, 102); // #003366
  doc.text('NextApp Inc. - Order Report', 20, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Generated: ${format(new Date(data.generatedAt), 'PPpp')}`, 20, 30);
  doc.text(`Date Range: ${data.filters.startDate} to ${data.filters.endDate}`, 20, 37);
  doc.text(`Status Filter: ${data.filters.status === 'all' ? 'All Status' : data.filters.status}`, 20, 44);

  // Summary Statistics
  doc.setFontSize(14);
  doc.setTextColor(0, 51, 102);
  doc.text('Summary Statistics', 20, 60);
  
  const summaryTableData = [
    ['Metric', 'Value'],
    ['Total Orders', data.stats.totalOrders.toString()],
    ['Total Revenue', `$${data.stats.totalRevenue.toFixed(2)}`],
    ['Average Order Value', `$${data.stats.avgOrderValue.toFixed(2)}`]
  ];

  autoTable(doc, {
    head: [summaryTableData[0]],
    body: summaryTableData.slice(1),
    startY: 65,
    theme: 'grid',
    headStyles: { fillColor: [0, 51, 102] },
    margin: { left: 20, right: 20 }
  });

  // Status Breakdown
  const statusTableData = [
    ['Status', 'Count'],
    ...Object.entries(data.stats.statusCounts).map(([status, count]) => [
      status.charAt(0).toUpperCase() + status.slice(1),
      count.toString()
    ])
  ];

  autoTable(doc, {
    head: [statusTableData[0]],
    body: statusTableData.slice(1),
    startY: (doc as any).lastAutoTable.finalY + 10,
    theme: 'grid',
    headStyles: { fillColor: [0, 51, 102] },
    margin: { left: 20, right: 20 }
  });

  // Orders Table
  doc.addPage();
  doc.setFontSize(14);
  doc.setTextColor(0, 51, 102);
  doc.text('Order Details', 20, 20);

  const ordersTableData = data.orders.map(order => [
    order.id,
    format(new Date(order.created_at), 'MM/dd/yyyy'),
    order.status,
    order.items.length.toString(),
    `$${order.total_price.toFixed(2)}`
  ]);

  autoTable(doc, {
    head: [['Order ID', 'Date', 'Status', 'Items', 'Total']],
    body: ordersTableData,
    startY: 30,
    theme: 'grid',
    headStyles: { fillColor: [0, 51, 102] },
    margin: { left: 20, right: 20 },
    styles: { fontSize: 10 }
  });

  doc.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const exportToWord = async (data: ReportData, filename: string) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Title
        new Paragraph({
          children: [
            new TextRun({
              text: "NextApp Inc. - Order Report",
              bold: true,
              size: 32,
              color: "003366"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),

        // Report Info
        new Paragraph({
          children: [
            new TextRun({
              text: `Generated: ${format(new Date(data.generatedAt), 'PPpp')}`,
              size: 24
            })
          ],
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Date Range: ${data.filters.startDate} to ${data.filters.endDate}`,
              size: 24
            })
          ],
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Status Filter: ${data.filters.status === 'all' ? 'All Status' : data.filters.status}`,
              size: 24
            })
          ],
          spacing: { after: 400 }
        }),

        // Summary Statistics Header
        new Paragraph({
          children: [
            new TextRun({
              text: "Summary Statistics",
              bold: true,
              size: 28,
              color: "003366"
            })
          ],
          spacing: { after: 200 }
        }),

        // Summary Table
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Metric", bold: true })] })]
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Value", bold: true })] })]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Total Orders" })] })]
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: data.stats.totalOrders.toString() })] })]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Total Revenue" })] })]
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: `$${data.stats.totalRevenue.toFixed(2)}` })] })]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Average Order Value" })] })]
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: `$${data.stats.avgOrderValue.toFixed(2)}` })] })]
                })
              ]
            })
          ]
        }),

        // Status Breakdown Header
        new Paragraph({
          children: [
            new TextRun({
              text: "Status Breakdown",
              bold: true,
              size: 28,
              color: "003366"
            })
          ],
          spacing: { before: 400, after: 200 }
        }),

        // Status Table
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })]
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Count", bold: true })] })]
                })
              ]
            }),
            ...Object.entries(data.stats.statusCounts).map(([status, count]) =>
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: status.charAt(0).toUpperCase() + status.slice(1) })] })]
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: count.toString() })] })]
                  })
                ]
              })
            )
          ]
        }),

        // Order Details Header
        new Paragraph({
          children: [
            new TextRun({
              text: "Order Details",
              bold: true,
              size: 28,
              color: "003366"
            })
          ],
          spacing: { before: 400, after: 200 }
        }),

        // Orders Table
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Order ID", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Date", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Items", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total", bold: true })] })] })
              ]
            }),
            ...data.orders.slice(0, 20).map(order =>
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: order.id })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: format(new Date(order.created_at), 'MM/dd/yyyy') })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: order.status })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: order.items.length.toString() })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${order.total_price.toFixed(2)}` })] })] })
                ]
              })
            )
          ]
        })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  saveAs(blob, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.docx`);
};