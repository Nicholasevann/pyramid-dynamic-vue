export const chartData =  [
  {
    name: "Production optimization",
    level: 1,
    onprogress: true,
    progressItem: [
      {
        field: "Deliver Profitable Project",
        value: "5-10%",
      },
    ],
  },
  {
    name: "Cost vigilance",
    level: 1,
    onprogress: true,
    progressItem: [
      { field: "Monitor Daily Expenses", value: "10%" },
      { field: "Review Supplier Contracts", value: "7%" },
    ],
  },
  {
    name: "DE",
    level: 2,
    subchild: [
      {
        subLevel: 1,
        name: "Operational Efficienct",
        onprogress: true,
        progressItem: [
          { field: "Improve Process", value: "15%" },
          { field: "Train Staff", value: "8%" },
        ],
      },
      {
        subLevel: 2,
        name: "Deliver Profitable Project",
        onprogress: false,
        progressItem: [
          { field: "Deliver Profitable Project Management", value: "100%" },
          { field: "Project Review", value: "100%" },
        ],
      },
    ],
  },
  {
    name: "Operational Cost",
    level: 2,
    onprogress: false,
    progressItem: [
      { field: "Operational Cost Management", value: "100%" },
      { field: "Expense Review", value: "100%" },
    ],
  },
  {
    name: "Decresing Methane Intensity",
    level: 2,
    onprogress: true,
    progressItem: [
      { field: "Upgrade Equipment", value: "12%" },
      { field: "Monitor Emissions", value: "6%" },
      { field: "Implement Best Practices", value: "9%" },
    ],
  },
  {
    name: "Operating Performance",
    level: 3,
    onprogress: true,
    progressItem: [
      { field: "System Tuning", value: "20%" },
      { field: "Asset Utilization", value: "15%" },
    ],
  },
  {
    name: "More Energy",
    level: 4,
    onprogress: true,
    progressItem: [
      { field: "Increase Output", value: "11%" },
    ],
  },
  {
    name: "Growing Cash Flow",
    level: 4,
    onprogress: true,
    progressItem: [
      { field: "Optimize Sales", value: "10%" },
      { field: "Reduce Overheads", value: "13%" },
    ],
  },
]